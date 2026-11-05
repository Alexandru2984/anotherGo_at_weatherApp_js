import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
process.env.OPENWEATHER_API_KEY = 'test-only-secret';
process.env.RATE_LIMIT = '500';
process.env.MAX_UPSTREAM_CONCURRENCY = '2';
process.env.UPSTREAM_RATE_LIMIT = '10';
const { server, responseCache } = await import('../server.js');
let port;
let upstream;
let upstreamCalls = 0;
const nativeFetch = globalThis.fetch;
globalThis.fetch = (...args) => { upstreamCalls++; return upstream(...args); };
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});
after(async () => { globalThis.fetch = nativeFetch; await new Promise(resolve => server.close(resolve)); });
function http(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, headers }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}
const weather = { dt: 123, main: { temp: 12 }, weather: [{ id: 800 }] };
const path = n => `/api/openweather/weather?lat=${n}&lon=26`;
test('HTTP boundary blocks repository files, traversal and unsupported methods', async () => {
  for (const file of ['/README.md', '/.env', '/.git/config', '/server.js', '/package.json', '/deploy/nginx-weather.production.conf', '/scripts/smoke-test.js', '/test/server.test.js', '/docs/AUDIT.md', '/%2e%2e/.env', '/unknown']) {
    assert.equal((await http(file)).status, 404, file);
  }
  assert.equal((await http('/%invalid')).status, 400);
  assert.equal((await http('/index.html', { method: 'POST' })).status, 405);
  const home = await http('/');
  assert.equal(home.status, 200);
  assert.ok(home.headers['content-security-policy'].includes("object-src 'none'"));
  assert.equal(home.headers['x-content-type-options'], 'nosniff');
  assert.equal((await http('/', { method: 'HEAD' })).body, '');
  assert.equal((await http('/', { headers: { 'If-None-Match': home.headers.etag } })).status, 304);
});
test('invalid and cross-origin API requests do not reach upstream', async () => {
  upstream = () => { throw new Error('must not reach upstream'); };
  assert.equal((await http('/api/openweather/weather')).status, 400);
  assert.equal((await http(path(44), { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await http(path(44), { headers: { Origin: 'https://attacker.invalid' } })).status, 403);
});
test('cache coalesces requests, hides keys and keeps location responses private', async () => {
  responseCache.clear();
  let calls = 0;
  upstream = async () => { calls++; return Response.json(weather); };
  const first = await http(path(44));
  const second = await http(path(44));
  assert.equal(first.status, 200);
  assert.equal(second.headers['x-weather-cache'], 'HIT');
  assert.equal(first.headers['cache-control'], 'no-store');
  assert.equal(calls, 1);
  assert.ok(!first.body.includes('test-only-secret'));
});
test('upstream errors are sanitized and stale responses are identified', async () => {
  for (const value of responseCache.values()) value.expiresAt = Date.now() - 1;
  upstream = async () => new Response('secret=do-not-expose', { status: 401 });
  const stale = await http(path(44));
  assert.equal(stale.status, 200);
  assert.equal(stale.headers['x-weather-cache'], 'STALE');
  const error = await http(path(45));
  assert.equal(error.status, 502);
  assert.ok(!error.body.includes('do-not-expose'));
});
test('oversized and malformed upstream responses fail closed', async () => {
  upstream = async () => new Response('x'.repeat(513 * 1024));
  assert.equal((await http(path(46))).status, 502);
  upstream = async () => new Response('<html>bad gateway</html>');
  assert.equal((await http(path(47))).status, 502);
});
test('upstream concurrency is bounded, while duplicate requests share work', async () => {
  const pending = [];
  upstream = () => new Promise(resolve => pending.push(resolve));
  const first = http(path(48));
  const second = http(path(49));
  while (pending.length < 2) await new Promise(resolve => setTimeout(resolve, 5));
  const duplicate = http(path(48));
  const busy = await http(path(50));
  assert.equal(busy.status, 503);
  assert.ok(Number(busy.headers['retry-after']) >= 1);
  for (const resolve of pending) resolve(Response.json(weather));
  assert.deepEqual((await Promise.all([first, second, duplicate])).map(x => x.status), [200, 200, 200]);
  assert.equal(pending.length, 2);
});

test('global upstream budget cannot be bypassed by requesting new coordinates', async () => {
  upstream = async () => Response.json(weather);
  const responses = [];
  for (let i = 51; i < 66; i++) responses.push(await http(path(i)));
  assert.equal(upstreamCalls, 10);
  assert.ok(responses.some(response => response.status === 503));
});
test('location links are excluded from indexing while the homepage remains indexable', async () => {
  assert.equal((await http('/?lat=44&lon=26')).headers['x-robots-tag'], 'noindex, follow');
  assert.equal((await http('/')).headers['x-robots-tag'], undefined);
  assert.equal((await http('/robots.txt')).status, 200);
  assert.equal((await http('/sitemap.xml')).status, 200);
});
