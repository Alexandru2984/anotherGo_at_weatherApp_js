import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchWeatherAndForecast, validCoordinates } from '../scripts/api.js?v=20261105-2';
import { storage, readJson } from '../scripts/storage.js?v=20261105-2';
const current = { name: 'Test', dt: 1, timezone: 0, coord: { lat: 44, lon: 26 }, main: { temp: 10, feels_like: 9, humidity: 70, pressure: 1010 }, wind: { speed: 2 }, weather: [{ icon: '01d' }] };
test('browser storage works when localStorage is unavailable and discards corrupt JSON', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Denied'); } });
  storage.setItem('test', 'value');
  assert.equal(storage.getItem('test'), 'value');
  storage.setItem('bad-json', '{oops');
  assert.deepEqual(readJson('bad-json', []), []);
  storage.removeItem('test');
  assert.equal(storage.getItem('test'), null);
  delete globalThis.localStorage;
});
test('optional upstream failures preserve valid current weather', async () => {
  const native = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes('/weather?') ? Response.json(current) : new Response('Unavailable', { status: 502 });
  try {
    const data = await fetchWeatherAndForecast({ lat: 44, lon: 26 });
    assert.equal(data.weather.name, 'Test');
    assert.equal(data.forecast, null);
    assert.equal(data.airQuality, null);
  } finally { globalThis.fetch = native; }
});
test('aborted requests never return a successful weather bundle', async () => {
  const native = globalThis.fetch;
  globalThis.fetch = async () => Response.json(current);
  const controller = new AbortController();
  controller.abort();
  try { await assert.rejects(fetchWeatherAndForecast({ lat: 44, lon: 26, signal: controller.signal }), { name: 'AbortError' }); }
  finally { globalThis.fetch = native; }
});
test('null and absent coordinates cannot become zero', () => {
  assert.equal(validCoordinates(null, null), false);
  assert.equal(validCoordinates(undefined, 26), false);
  assert.equal(validCoordinates(0, 0), true);
});
