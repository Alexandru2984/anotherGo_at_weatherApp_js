// Unit tests for the server's pure helpers. No network, no listening socket.
// Env is set before importing so the module picks up small test-friendly caps.
process.env.OPENWEATHER_API_KEY = "testkey";
process.env.TRUST_PROXY = "true";
process.env.RATE_LIMIT = "3";
process.env.RATE_WINDOW_MS = "60000";
process.env.MAX_CACHE_ENTRIES = "3";

import { test } from "node:test";
import assert from "node:assert/strict";

const srv = await import("../server.js");

const apiUrl = (path) => new URL(`http://localhost/api/openweather/${path}`);
const ctrl = (code) => String.fromCharCode(code);

test("normalizeCity trims, collapses spaces and rejects bad input", () => {
  assert.equal(srv.normalizeCity("  New   York "), "New York");
  assert.equal(srv.normalizeCity(""), "");
  assert.equal(srv.normalizeCity("a".repeat(81)), "");
  assert.equal(srv.normalizeCity("bad<script>"), "");
  assert.equal(srv.normalizeCity("Cluj-Napoca"), "Cluj-Napoca");
});

test("normalizeCity rejects non-whitespace control characters", () => {
  assert.equal(srv.normalizeCity("bad" + ctrl(0) + "nul"), "");
  assert.equal(srv.normalizeCity("bell" + ctrl(7) + "x"), "");
  assert.equal(srv.normalizeCity("del" + ctrl(127)), "");
});

test("normalizeUnits and normalizeLanguage fall back to safe defaults", () => {
  assert.equal(srv.normalizeUnits("imperial"), "imperial");
  assert.equal(srv.normalizeUnits("metric"), "metric");
  assert.equal(srv.normalizeUnits("plasma"), "metric");
  assert.equal(srv.normalizeLanguage("en"), "en");
  assert.equal(srv.normalizeLanguage("ro"), "ro");
  assert.equal(srv.normalizeLanguage("fr"), "ro");
});

test("latitude/longitude validation respects bounds", () => {
  assert.ok(srv.isValidLatitude(-90) && srv.isValidLatitude(90));
  assert.ok(!srv.isValidLatitude(91) && !srv.isValidLatitude(NaN));
  assert.ok(srv.isValidLongitude(-180) && srv.isValidLongitude(180));
  assert.ok(!srv.isValidLongitude(181) && !srv.isValidLongitude("x"));
});

test("buildOpenWeatherUrl builds valid weather/geo/air URLs", () => {
  const weather = srv.buildOpenWeatherUrl(apiUrl("weather?lat=44.4&lon=26.1&units=metric&lang=ro"));
  assert.equal(weather.pathname, "/data/2.5/weather");
  assert.equal(weather.searchParams.get("lat"), "44.4");
  assert.equal(weather.searchParams.get("units"), "metric");
  assert.equal(weather.searchParams.get("appid"), "testkey");

  const geo = srv.buildOpenWeatherUrl(apiUrl("geo/direct?q=Bucuresti&limit=1"));
  assert.equal(geo.pathname, "/geo/1.0/direct");
  assert.equal(geo.searchParams.get("q"), "Bucuresti");
  assert.equal(geo.searchParams.get("limit"), "1");

  const air = srv.buildOpenWeatherUrl(apiUrl("air_pollution?lat=44.4&lon=26.1"));
  assert.equal(air.pathname, "/data/2.5/air_pollution");
  assert.ok(!air.searchParams.has("units"), "air pollution must not carry units");
});

test("buildOpenWeatherUrl rejects invalid input", () => {
  assert.equal(srv.buildOpenWeatherUrl(apiUrl("bogus")), null);
  assert.equal(srv.buildOpenWeatherUrl(apiUrl("weather?lat=999&lon=26")), null);
  assert.equal(srv.buildOpenWeatherUrl(apiUrl("geo/direct?limit=1")), null);
  assert.equal(srv.buildOpenWeatherUrl(apiUrl("geo/direct?q=x&limit=9")), null);
});

test("getCacheKey strips appid and sorts params", () => {
  const key = srv.getCacheKey(new URL("https://api.openweathermap.org/data/2.5/weather?lon=26&lat=44&appid=secret"));
  assert.ok(!key.includes("appid"));
  assert.ok(!key.includes("secret"));
  assert.equal(key, "/data/2.5/weather?lat=44&lon=26");
});

test("getClientIp prefers Cloudflare header, falls back to socket", () => {
  assert.equal(srv.getClientIp({ headers: { "cf-connecting-ip": "9.9.9.9" }, socket: {} }), "9.9.9.9");
  assert.equal(srv.getClientIp({ headers: {}, socket: { remoteAddress: "1.2.3.4" } }), "1.2.3.4");
});

test("isRateLimited blocks after the configured limit", () => {
  const req = { headers: { "cf-connecting-ip": "5.5.5.5" }, socket: {} };
  assert.equal(srv.isRateLimited(req), false); // 1
  assert.equal(srv.isRateLimited(req), false); // 2
  assert.equal(srv.isRateLimited(req), false); // 3
  assert.equal(srv.isRateLimited(req), true); // 4 > limit(3)
});

test("setCacheEntry caps entries with FIFO eviction", () => {
  srv.responseCache.clear();
  const entry = () => ({ payload: "x", expiresAt: Date.now() + 1000, staleUntil: Date.now() + 1000 });
  srv.setCacheEntry("a", entry());
  srv.setCacheEntry("b", entry());
  srv.setCacheEntry("c", entry());
  srv.setCacheEntry("d", entry()); // evicts oldest ("a")
  assert.equal(srv.responseCache.size, 3);
  assert.ok(!srv.responseCache.has("a"));
  assert.ok(srv.responseCache.has("d"));
});

test("sweepExpired removes stale cache and rate entries", () => {
  srv.responseCache.clear();
  srv.rateBuckets.clear();
  srv.responseCache.set("old", { payload: "x", expiresAt: 0, staleUntil: Date.now() - 1 });
  srv.rateBuckets.set("ip", { count: 1, resetAt: Date.now() - 1 });
  srv.sweepExpired();
  assert.ok(!srv.responseCache.has("old"));
  assert.ok(!srv.rateBuckets.has("ip"));
});
