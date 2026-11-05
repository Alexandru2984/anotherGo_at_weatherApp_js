import { createReadStream, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { isIP } from 'node:net';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = fileURLToPath(new URL('.', import.meta.url));
function envInteger(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${name} configuration`);
  }
  return value;
}
const port = envInteger('PORT', 3050, 0, 65535);
const host = process.env.HOST || '127.0.0.1';
const openWeatherApiKey = process.env.OPENWEATHER_API_KEY || '';
const trustProxy = process.env.TRUST_PROXY === 'true';
const appVersion = process.env.APP_VERSION || '2.0.0';
const apiRateWindowMs = envInteger('RATE_WINDOW_MS', 60_000, 1000, 3_600_000);
const apiRateLimit = envInteger('RATE_LIMIT', 90, 1, 10_000);
const maxCacheEntries = envInteger('MAX_CACHE_ENTRIES', 500, 1, 2000);
const maxRateBuckets = envInteger('MAX_RATE_BUCKETS', 20_000, 1, 100_000);
const maxInflight = envInteger('MAX_UPSTREAM_CONCURRENCY', 8, 1, 32);
const upstreamRateLimit = envInteger('UPSTREAM_RATE_LIMIT', 50, 1, 1000);
const maxPayloadBytes = 512 * 1024;
const rateBuckets = new Map();
const responseCache = new Map();
const inflightRequests = new Map();
let upstreamWindow = { count: 0, resetAt: 0 };
const cacheTtls = { 'geo/direct': 86_400_000, weather: 120_000, forecast: 600_000, air_pollution: 1_800_000 };
const staleTtls = { 'geo/direct': 604_800_000, weather: 1_800_000, forecast: 7_200_000, air_pollution: 7_200_000 };

// Only intentionally published assets. Adding a repository file cannot publish it.
const publicPaths = new Set([
  '/index.html', '/offline.html', '/manifest.webmanifest', '/favicon.ico',
  '/sw.js', '/sw-v4.js', '/robots.txt', '/sitemap.xml',
  '/styles/styles.css', '/styles/icons.css', '/fonts/fa-solid-900.woff2',
  '/scripts/app.js', '/scripts/api.js', '/scripts/config.js', '/scripts/ui.js',
  '/scripts/theme.js', '/scripts/utils.js', '/scripts/storage.js', '/scripts/forecast.js',
  '/scripts/insights.js', '/icons/icon.svg', '/icons/favicon-32.png',
  '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/maskable-512.png', '/images/appScreenshot.jpg',
]);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'", "script-src 'self'", "style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com", "img-src 'self' https://openweathermap.org data:",
    "connect-src 'self'", "worker-src 'self'", "manifest-src 'self'", "object-src 'none'",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
};
function setSecurityHeaders(res) {
  for (const [name, value] of Object.entries(securityHeaders)) res.setHeader(name, value);
}
function sendJson(res, status, payload, headers = {}) {
  if (res.destroyed || res.writableEnded) return;
  setSecurityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(payload));
}
function canonicalIp(value) {
  if (typeof value !== 'string' || value.includes('%') || !isIP(value.trim())) return '';
  const ip = value.trim().toLowerCase();
  if (ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
  return isIP(ip) === 6 ? new URL(`http://[${ip}]`).hostname.slice(1, -1) : ip;
}
function getClientIp(req) {
  const peer = canonicalIp(req.socket.remoteAddress) || 'unknown';
  // nginx overwrites X-Real-IP after its trusted Cloudflare real_ip processing.
  // Never trust client-supplied CF/XFF or headers from a non-loopback peer.
  if (trustProxy && (peer === '127.0.0.1' || peer === '::1')) {
    return canonicalIp(req.headers['x-real-ip']) || peer;
  }
  return peer;
}
function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    if (!bucket && rateBuckets.size >= maxRateBuckets) {
      sweepExpired(now);
      if (rateBuckets.size >= maxRateBuckets) return true;
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + apiRateWindowMs });
    return false;
  }
  return ++bucket.count > apiRateLimit;
}
function isValidLatitude(value) { return Number.isFinite(value) && value >= -90 && value <= 90; }
function isValidLongitude(value) { return Number.isFinite(value) && value >= -180 && value <= 180; }
function normalizeCity(value) {
  const raw = String(value || '');
  if (/[\u0000-\u001f\u007f<>]/.test(raw)) return '';
  const city = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  return city && city.length <= 80 ? city : '';
}
function normalizeUnits(value) { return value === 'imperial' ? 'imperial' : 'metric'; }
function normalizeLanguage(value) { return value === 'en' ? 'en' : 'ro'; }
function parseCoordinate(value) {
  return typeof value === 'string' && /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value) ? Number(value) : NaN;
}
function buildOpenWeatherUrl(reqUrl) {
  const path = reqUrl.pathname.slice('/api/openweather/'.length);
  if (!Object.hasOwn(cacheTtls, path)) return null;
  const allowed = path === 'geo/direct' ? ['q', 'limit'] : path === 'air_pollution' ? ['lat', 'lon'] : ['lat', 'lon', 'units', 'lang'];
  for (const name of reqUrl.searchParams.keys()) {
    if (!allowed.includes(name) || reqUrl.searchParams.getAll(name).length !== 1) return null;
  }
  const upstream = new URL('https://api.openweathermap.org');
  if (path === 'geo/direct') {
    const city = normalizeCity(reqUrl.searchParams.get('q'));
    const limit = reqUrl.searchParams.get('limit') ?? '1';
    if (!city || !/^[1-5]$/.test(limit)) return null;
    upstream.pathname = '/geo/1.0/direct';
    upstream.searchParams.set('q', city);
    upstream.searchParams.set('limit', limit);
  } else {
    const lat = parseCoordinate(reqUrl.searchParams.get('lat'));
    const lon = parseCoordinate(reqUrl.searchParams.get('lon'));
    if (!isValidLatitude(lat) || !isValidLongitude(lon)) return null;
    const units = reqUrl.searchParams.get('units') ?? 'metric';
    const lang = reqUrl.searchParams.get('lang') ?? 'ro';
    if (!['metric', 'imperial'].includes(units) || !['ro', 'en'].includes(lang)) return null;
    upstream.pathname = `/data/2.5/${path}`;
    // ~1 metre precision avoids irrelevant cache fragmentation from GPS noise.
    upstream.searchParams.set('lat', String(Number(lat.toFixed(5))));
    upstream.searchParams.set('lon', String(Number(lon.toFixed(5))));
    if (path !== 'air_pollution') {
      upstream.searchParams.set('units', units);
      upstream.searchParams.set('lang', lang);
    }
  }
  upstream.searchParams.set('appid', openWeatherApiKey);
  return upstream;
}
function getCacheKey(url) {
  const copy = new URL(url);
  copy.searchParams.delete('appid');
  copy.searchParams.sort();
  return `${copy.pathname}?${copy.searchParams}`;
}
function setCacheEntry(key, value) {
  responseCache.delete(key);
  if (responseCache.size >= maxCacheEntries) responseCache.delete(responseCache.keys().next().value);
  responseCache.set(key, value);
}
function sweepExpired(now = Date.now()) {
  for (const [key, value] of responseCache) if (now >= value.staleUntil) responseCache.delete(key);
  for (const [key, value] of rateBuckets) if (now >= value.resetAt) rateBuckets.delete(key);
}
function cachedResponse(key, allowStale = false) {
  const entry = responseCache.get(key);
  if (!entry || Date.now() >= entry.staleUntil) return null;
  const stale = Date.now() >= entry.expiresAt;
  if (stale && !allowStale) return null;
  return { payload: entry.payload, status: 200, cacheState: stale ? 'STALE' : 'HIT', age: Math.floor((Date.now() - entry.fetchedAt) / 1000) };
}
async function readLimitedJson(response) {
  if (Number(response.headers.get('content-length')) > maxPayloadBytes) throw new Error('Payload too large');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxPayloadBytes) throw new Error('Payload too large');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
function validPayload(path, data) {
  if (path === 'geo/direct') return Array.isArray(data) && data.length <= 5 && data.every(x => typeof x.name === 'string' && isValidLatitude(x.lat) && isValidLongitude(x.lon));
  if (path === 'weather') return Number.isFinite(data?.main?.temp) && Array.isArray(data.weather) && data.weather.length > 0 && Number.isFinite(data.dt);
  return Array.isArray(data?.list) && data.list.length <= (path === 'forecast' ? 40 : 48);
}
async function fetchOpenWeatherPayload(url, key, path) {
  const cached = cachedResponse(key);
  if (cached) return cached;
  if (inflightRequests.has(key)) return inflightRequests.get(key);
  const now = Date.now();
  if (now >= upstreamWindow.resetAt) upstreamWindow = { count: 0, resetAt: now + 60_000 };
  if (inflightRequests.size >= maxInflight || upstreamWindow.count >= upstreamRateLimit) {
    return cachedResponse(key, true) || { status: 503, payload: JSON.stringify({ error: 'Weather service busy', code: 'UPSTREAM_BUSY' }), cacheState: 'BYPASS', retryAfter: Math.max(1, Math.ceil((upstreamWindow.resetAt - now) / 1000)) };
  }
  upstreamWindow.count++;
  const pending = (async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error', headers: { Accept: 'application/json' } });
      if (!response.ok) {
        await response.body?.cancel();
        console.warn(JSON.stringify({ event: 'upstream_error', status: response.status }));
        return cachedResponse(key, true) || { status: response.status === 404 ? 404 : 502, payload: JSON.stringify({ error: 'Weather service unavailable', code: 'UPSTREAM_ERROR' }), cacheState: 'MISS' };
      }
      const data = await readLimitedJson(response);
      if (!validPayload(path, data)) throw new Error('Invalid upstream response');
      const payload = JSON.stringify(data);
      const fetchedAt = Date.now();
      setCacheEntry(key, { payload, fetchedAt, expiresAt: fetchedAt + cacheTtls[path], staleUntil: fetchedAt + cacheTtls[path] + staleTtls[path] });
      return { status: 200, payload, cacheState: 'MISS', age: 0 };
    } catch (error) {
      const timeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      console.warn(JSON.stringify({ event: 'upstream_failure', reason: timeout ? 'timeout' : 'invalid_or_unavailable' }));
      return cachedResponse(key, true) || { status: timeout ? 504 : 502, payload: JSON.stringify({ error: 'Weather service unavailable', code: 'UPSTREAM_ERROR' }), cacheState: 'MISS' };
    } finally {
      inflightRequests.delete(key);
    }
  })();
  inflightRequests.set(key, pending);
  return pending;
}
async function handleOpenWeatherProxy(req, res, url) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET' });
  const site = req.headers['sec-fetch-site'];
  if (site === 'cross-site' || site === 'same-site') return sendJson(res, 403, { error: 'Cross-origin request denied' });
  const origin = req.headers.origin;
  if (origin) {
    try {
      const expected = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : new URL(`http://${req.headers.host}`).origin;
      if (new URL(origin).origin !== expected) return sendJson(res, 403, { error: 'Cross-origin request denied' });
    } catch { return sendJson(res, 403, { error: 'Cross-origin request denied' }); }
  }
  const upstream = buildOpenWeatherUrl(url);
  if (!upstream) return sendJson(res, 400, { error: 'Invalid weather request' });
  if (isRateLimited(req)) return sendJson(res, 429, { error: 'Too many requests', code: 'RATE_LIMITED' }, { 'Retry-After': String(Math.ceil(apiRateWindowMs / 1000)) });
  if (!openWeatherApiKey) return sendJson(res, 503, { error: 'Weather service unavailable' });
  const path = url.pathname.slice('/api/openweather/'.length);
  const response = await fetchOpenWeatherPayload(upstream, getCacheKey(upstream), path);
  if (res.destroyed || res.writableEnded) return;
  setSecurityHeaders(res);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Weather-Cache': response.cacheState, 'Vary': 'Sec-Fetch-Site, Origin' };
  if (response.age !== undefined) headers['X-Weather-Age'] = String(response.age);
  if (response.retryAfter) headers['Retry-After'] = String(response.retryAfter);
  res.writeHead(response.status, headers);
  res.end(response.payload);
}
function serveStatic(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method)) return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return sendJson(res, 400, { error: 'Bad request' }); }
  if (path === '/') path = '/index.html';
  if (!publicPaths.has(path)) return sendJson(res, 404, { error: 'Not found' });
  const file = resolve(publicRoot, path.slice(1));
  let stat;
  try {
    if (realpathSync(file) !== file) return sendJson(res, 404, { error: 'Not found' });
    stat = statSync(file);
    if (!stat.isFile()) return sendJson(res, 404, { error: 'Not found' });
  } catch { return sendJson(res, 404, { error: 'Not found' }); }
  setSecurityHeaders(res);
  const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
  const headers = { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=0, must-revalidate', ETag: etag };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
const server = createServer({ maxHeaderSize: 8192, headersTimeout: 10_000, requestTimeout: 15_000, keepAliveTimeout: 5000 }, (req, res) => {
  const startedAt = performance.now();
  let url;
  try { url = new URL(req.url || '/', 'http://localhost'); } catch { return sendJson(res, 400, { error: 'Bad request' }); }
  res.on('finish', () => console.log(JSON.stringify({ time: new Date().toISOString(), method: req.method, path: publicPaths.has(url.pathname) || Object.hasOwn(cacheTtls, url.pathname.slice('/api/openweather/'.length)) || url.pathname === '/healthz' || url.pathname === '/' ? url.pathname : '[other]', status: res.statusCode, duration_ms: Math.round(performance.now() - startedAt) })));
  if ((req.url || '').length > 2048) return sendJson(res, 414, { error: 'URI too long' });
  if (req.headers['transfer-encoding'] || Number(req.headers['content-length'] || 0) > 0) {
    res.setHeader('Connection', 'close');
    return sendJson(res, 400, { error: 'Request body not supported' });
  }
  if (url.pathname === '/healthz') {
    if (!['GET', 'HEAD'].includes(req.method)) return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
    return sendJson(res, 200, { ok: true, version: appVersion });
  }
  if (url.pathname.startsWith('/api/')) {
    if (!url.pathname.startsWith('/api/openweather/')) return sendJson(res, 404, { error: 'Not found' });
    handleOpenWeatherProxy(req, res, url).catch(() => sendJson(res, 500, { error: 'Request failed' }));
    return;
  }
  serveStatic(req, res, url);
});
server.maxConnections = 200;
server.maxRequestsPerSocket = 100;
server.maxHeadersCount = 50;
server.setTimeout(15_000, socket => socket.destroy());
server.on('clientError', (_error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
});
function startServer() {
  if (!openWeatherApiKey) console.warn('OPENWEATHER_API_KEY is not configured; weather API disabled.');
  server.listen(port, host, () => console.log(`Weather app listening on http://${host}:${server.address().port}`));
  const timer = setInterval(sweepExpired, 60_000);
  timer.unref();
}
function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 10_000).unref();
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.on('error', error => { console.error(`HTTP server failed: ${error.code || 'unknown'}`); process.exit(1); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  startServer();
}
export { server, startServer, buildOpenWeatherUrl, getCacheKey, getClientIp, normalizeCity, normalizeUnits, normalizeLanguage, isValidLatitude, isValidLongitude, isRateLimited, setCacheEntry, sweepExpired, responseCache, rateBuckets, fetchOpenWeatherPayload, readLimitedJson, envInteger };
