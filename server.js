import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = resolve(__dirname);
const port = Number(process.env.PORT || 3050);
const host = process.env.HOST || "127.0.0.1";
const openWeatherApiKey = process.env.OPENWEATHER_API_KEY || "";
const trustProxy = process.env.TRUST_PROXY === "true";
const appVersion = process.env.APP_VERSION || "dev";
const requestTimeoutMs = 8000;
const apiRateWindowMs = Number(process.env.RATE_WINDOW_MS || 60_000);
const apiRateLimit = Number(process.env.RATE_LIMIT || 90);

// Hard caps so the in-memory maps can never grow without bound (memory-DoS guard).
const maxCacheEntries = Number(process.env.MAX_CACHE_ENTRIES || 500);
const maxRateBuckets = Number(process.env.MAX_RATE_BUCKETS || 20_000);
const maxUrlLength = 2048;
const sweepIntervalMs = 60_000;

const rateBuckets = new Map();
const responseCache = new Map();
const inflightRequests = new Map();

const cacheTtls = {
  "geo/direct": 24 * 60 * 60 * 1000,
  weather: 2 * 60 * 1000,
  forecast: 10 * 60 * 1000,
  air_pollution: 30 * 60 * 1000,
};

const staleTtls = {
  "geo/direct": 7 * 24 * 60 * 60 * 1000,
  weather: 30 * 60 * 1000,
  forecast: 2 * 60 * 60 * 1000,
  air_pollution: 2 * 60 * 60 * 1000,
};

// Server-side files that live in the project root but must never be served as
// static assets, even when the static server runs from the repo directory.
const blockedStaticPaths = /^\/(server\.js|package(-lock)?\.json|scripts\/smoke-test\.js|test\/|tests\/|deploy\/|\.github\/)/;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
    "img-src 'self' https://openweathermap.org data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function logRequest(req, statusCode, startedAt) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  // Log the pathname only; query strings carry coordinates/city (user location PII).
  let path = req.url || "/";
  try {
    path = new URL(req.url || "/", "http://localhost").pathname;
  } catch {
    path = "/";
  }
  const logLine = {
    time: new Date().toISOString(),
    method: req.method,
    path,
    status: statusCode,
    duration_ms: Math.round(durationMs),
    ip: getClientIp(req),
  };

  console.log(JSON.stringify(logLine));
}

function setSecurityHeaders(res) {
  for (const [header, value] of Object.entries(securityHeaders)) {
    res.setHeader(header, value);
  }
}

function sendJson(res, statusCode, payload) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  if (trustProxy) {
    // Behind Cloudflare, the real visitor IP is in CF-Connecting-IP. X-Real-IP /
    // X-Forwarded-For only hold the Cloudflare edge address, so prefer CF first.
    const cfIp = req.headers["cf-connecting-ip"];
    if (typeof cfIp === "string" && cfIp.trim()) {
      return cfIp.trim();
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
      return realIp.trim();
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
      return forwardedFor.split(",")[0].trim();
    }
  }

  return req.socket.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    // Cap the number of tracked IPs; if full, drop the oldest entry first so a
    // flood of distinct/spoofed addresses cannot exhaust memory.
    if (rateBuckets.size >= maxRateBuckets && !rateBuckets.has(ip)) {
      const oldestKey = rateBuckets.keys().next().value;
      if (oldestKey !== undefined) {
        rateBuckets.delete(oldestKey);
      }
    }
    rateBuckets.set(ip, {
      count: 1,
      resetAt: now + apiRateWindowMs,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > apiRateLimit;
}

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeCity(value) {
  const city = String(value || "").trim().replace(/\s+/g, " ");
  if (!city || city.length > 80 || /[\u0000-\u001f\u007f<>]/.test(city)) {
    return "";
  }

  return city;
}

function normalizeUnits(value) {
  return value === "imperial" ? "imperial" : "metric";
}

function normalizeLanguage(value) {
  return ["ro", "en"].includes(value) ? value : "ro";
}

function buildOpenWeatherUrl(reqUrl) {
  const incomingPath = reqUrl.pathname.replace(/^\/api\/openweather\/?/, "");
  const upstream = new URL("https://api.openweathermap.org/");

  if (incomingPath === "geo/direct") {
    const city = normalizeCity(reqUrl.searchParams.get("q"));
    const limit = Number(reqUrl.searchParams.get("limit") || 1);

    if (!city || !Number.isInteger(limit) || limit < 1 || limit > 5) {
      return null;
    }

    upstream.pathname = "/geo/1.0/direct";
    upstream.searchParams.set("q", city);
    upstream.searchParams.set("limit", String(limit));
  } else if (incomingPath === "weather" || incomingPath === "forecast" || incomingPath === "air_pollution") {
    const lat = Number(reqUrl.searchParams.get("lat"));
    const lon = Number(reqUrl.searchParams.get("lon"));

    if (!isValidLatitude(lat) || !isValidLongitude(lon)) {
      return null;
    }

    upstream.pathname = `/data/2.5/${incomingPath}`;
    upstream.searchParams.set("lat", String(lat));
    upstream.searchParams.set("lon", String(lon));
    if (incomingPath !== "air_pollution") {
      upstream.searchParams.set("units", normalizeUnits(reqUrl.searchParams.get("units")));
      upstream.searchParams.set("lang", normalizeLanguage(reqUrl.searchParams.get("lang")));
    }
  } else {
    return null;
  }

  upstream.searchParams.set("appid", openWeatherApiKey);
  return upstream;
}

function getCacheKey(upstreamUrl) {
  const cacheUrl = new URL(upstreamUrl);
  cacheUrl.searchParams.delete("appid");
  cacheUrl.searchParams.sort();
  return `${cacheUrl.pathname}?${cacheUrl.searchParams.toString()}`;
}

function getCacheTtl(reqUrl) {
  const incomingPath = reqUrl.pathname.replace(/^\/api\/openweather\/?/, "");
  return cacheTtls[incomingPath] || 60_000;
}

function getStaleTtl(reqUrl) {
  const incomingPath = reqUrl.pathname.replace(/^\/api\/openweather\/?/, "");
  return staleTtls[incomingPath] || 30 * 60 * 1000;
}

function setCacheEntry(cacheKey, entry) {
  // Refresh insertion order on update, and cap total entries (FIFO eviction) so
  // an attacker iterating distinct coordinates cannot grow the cache unbounded.
  if (responseCache.has(cacheKey)) {
    responseCache.delete(cacheKey);
  } else if (responseCache.size >= maxCacheEntries) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) {
      responseCache.delete(oldestKey);
    }
  }
  responseCache.set(cacheKey, entry);
}

function sweepExpired(now = Date.now()) {
  for (const [key, entry] of responseCache) {
    if (now > entry.staleUntil) {
      responseCache.delete(key);
    }
  }
  for (const [ip, bucket] of rateBuckets) {
    if (now > bucket.resetAt) {
      rateBuckets.delete(ip);
    }
  }
}

function getCachedPayload(cacheKey) {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.staleUntil) {
    responseCache.delete(cacheKey);
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.payload;
}

function getStalePayload(cacheKey) {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.staleUntil) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.payload;
}

async function fetchOpenWeatherPayload(upstreamUrl, cacheKey, cacheTtl, staleTtl) {
  const cachedPayload = getCachedPayload(cacheKey);
  if (cachedPayload) {
    return {
      payload: cachedPayload,
      status: 200,
      cacheState: "HIT",
    };
  }

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const upstreamRes = await fetch(upstreamUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      const payload = await upstreamRes.text();

      if (upstreamRes.ok) {
        setCacheEntry(cacheKey, {
          payload,
          expiresAt: Date.now() + cacheTtl,
          staleUntil: Date.now() + cacheTtl + staleTtl,
        });
      }

      if (!upstreamRes.ok) {
        const stalePayload = getStalePayload(cacheKey);
        if (stalePayload) {
          return {
            payload: stalePayload,
            status: 200,
            cacheState: "STALE",
          };
        }
      }

      return {
        payload,
        status: upstreamRes.status,
        cacheState: "MISS",
      };
    } catch (error) {
      const stalePayload = getStalePayload(cacheKey);
      if (stalePayload) {
        return {
          payload: stalePayload,
          status: 200,
          cacheState: "STALE",
        };
      }

      return {
        payload: JSON.stringify({ error: "Weather service unavailable" }),
        status: error.name === "AbortError" ? 504 : 502,
        cacheState: "MISS",
      };
    } finally {
      clearTimeout(timeoutId);
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

async function handleOpenWeatherProxy(req, res, reqUrl) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!openWeatherApiKey) {
    sendJson(res, 500, { error: "OpenWeatherMap API key is not configured" });
    return;
  }

  if (isRateLimited(req)) {
    sendJson(res, 429, { error: "Too many requests" });
    return;
  }

  const upstreamUrl = buildOpenWeatherUrl(reqUrl);
  if (!upstreamUrl) {
    sendJson(res, 400, { error: "Invalid weather request" });
    return;
  }

  const cacheKey = getCacheKey(upstreamUrl);
  const cacheTtl = getCacheTtl(reqUrl);
  const staleTtl = getStaleTtl(reqUrl);
  const response = await fetchOpenWeatherPayload(upstreamUrl, cacheKey, cacheTtl, staleTtl);

  setSecurityHeaders(res);
  res.writeHead(response.status === 200 ? 200 : response.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": response.status === 200 ? `public, max-age=${Math.round(cacheTtl / 1000)}` : "no-store",
    "X-Weather-Cache": response.cacheState,
  });
  res.end(response.payload);
}

function handleHealthcheck(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  // Keep this minimal: it is unauthenticated. No key presence or cache internals.
  sendJson(res, 200, {
    ok: true,
    version: appVersion,
    uptime_seconds: Math.round(process.uptime()),
  });
}

function serveStatic(req, res, reqUrl) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(reqUrl.pathname);
  } catch {
    sendJson(res, 400, { error: "Bad request" });
    return;
  }

  const requestPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(publicRoot, safePath));
  const relativePath = filePath.slice(publicRoot.length);

  // Use a path-boundary check (publicRoot + separator), not a bare prefix, so a
  // sibling directory like "<publicRoot>_secret" cannot escape the web root.
  const withinRoot = filePath === publicRoot || filePath.startsWith(publicRoot + sep);
  const normalizedRelative = relativePath.split(sep).join("/");
  if (
    !withinRoot ||
    /(^|[/\\])\.[^/\\]+/.test(relativePath) ||
    blockedStaticPaths.test(normalizedRelative)
  ) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const ext = extname(filePath).toLowerCase();
  setSecurityHeaders(res);
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=604800",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  const startedAt = process.hrtime.bigint();
  const originalWriteHead = res.writeHead;
  res.writeHead = function writeHeadWithLogging(statusCode, ...args) {
    res.statusCode = statusCode;
    return originalWriteHead.call(this, statusCode, ...args);
  };
  res.on("finish", () => logRequest(req, res.statusCode, startedAt));

  if ((req.url || "").length > maxUrlLength) {
    sendJson(res, 414, { error: "URI too long" });
    return;
  }

  let reqUrl;
  try {
    reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  } catch {
    sendJson(res, 400, { error: "Bad request" });
    return;
  }

  if (reqUrl.pathname === "/healthz") {
    handleHealthcheck(req, res);
    return;
  }

  if (reqUrl.pathname.startsWith("/api/openweather/")) {
    handleOpenWeatherProxy(req, res, reqUrl);
    return;
  }

  serveStatic(req, res, reqUrl);
});

// Reject malformed requests cleanly instead of leaking a stack trace / hanging.
server.on("clientError", (err, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use; cannot start server.`);
  } else {
    console.error("HTTP server error:", error.message);
  }
  process.exit(1);
});

function startServer() {
  if (!openWeatherApiKey) {
    console.warn(
      "WARNING: OPENWEATHER_API_KEY is not set. Static files will be served, " +
        "but /api/openweather/* will return 500 until a key is configured in .env."
    );
  }

  server.listen(port, host, () => {
    console.log(`Weather app listening on http://${host}:${port}`);
  });

  // Periodically drop expired cache/rate entries so memory stays bounded even
  // when traffic is sparse. unref() lets the process exit if nothing else runs.
  const sweepTimer = setInterval(() => sweepExpired(), sweepIntervalMs);
  if (typeof sweepTimer.unref === "function") {
    sweepTimer.unref();
  }
}

function shutdown(signal) {
  console.log(`Received ${signal}, closing HTTP server`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Only auto-start when run directly (node server.js); stay importable for tests.
const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  startServer();
}

export {
  buildOpenWeatherUrl,
  getCacheKey,
  getClientIp,
  normalizeCity,
  normalizeUnits,
  normalizeLanguage,
  isValidLatitude,
  isValidLongitude,
  isRateLimited,
  setCacheEntry,
  sweepExpired,
  responseCache,
  rateBuckets,
};
