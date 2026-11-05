import assert from 'node:assert/strict';
import { validWeather, validForecast } from './api.js';
const baseUrl = new URL(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8105');
async function check(path, name, validate, statuses = [200], method = 'GET') {
  const start = Date.now();
  const response = await fetch(new URL(path, baseUrl), { method, signal: AbortSignal.timeout(12_000), headers: { Accept: path.startsWith('/api/') || path === '/healthz' ? 'application/json' : '*/*' }, cache: 'no-store' });
  assert.ok(statuses.includes(response.status), `${name}: unexpected HTTP ${response.status}`);
  if (validate) await validate(response);
  else await response.body?.cancel();
  console.log(`${name}: ${response.status} ${Date.now() - start}ms`);
}
await check('/', 'home and security headers', async response => {
  assert.ok(response.headers.get('content-security-policy')?.includes("script-src 'self'"));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.ok((await response.text()).includes('id="main-content"'));
});
await check('/healthz', 'health', async response => assert.equal((await response.json()).ok, true));
await check('/manifest.webmanifest', 'manifest', async response => assert.equal((await response.json()).start_url, '/'));
await check('/sw-v4.js', 'service worker loader');
await check('/robots.txt', 'robots');
await check('/sitemap.xml', 'sitemap');
await check('/icons/weather/01d.svg', 'local weather icons');
await check('/api/openweather/geo/direct?q=Bucuresti&limit=1', 'geocoding', async response => assert.ok((await response.json()).length > 0));
await check('/api/openweather/weather?lat=44.4268&lon=26.1025&units=metric&lang=ro', 'weather', async response => assert.ok(validWeather(await response.json())));
await check('/api/openweather/forecast?lat=44.4268&lon=26.1025&units=metric&lang=ro', 'forecast', async response => assert.ok(validForecast(await response.json())));
await check('/api/openweather/air_pollution?lat=44.4268&lon=26.1025', 'air quality', async response => assert.ok((await response.json()).list?.length));
await check('/README.md', 'private README', null, [403, 404]);
await check('/server.js', 'private server source', null, [403, 404]);
await check('/api/openweather/weather', 'missing coordinates rejected', null, [400]);
