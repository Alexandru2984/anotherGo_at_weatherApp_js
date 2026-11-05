import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupForecast, activitySlots, summarizeForecast } from '../scripts/forecast.js';
const now = Date.UTC(2026, 10, 5, 20) / 1000;
function item(hours, temp = 18, pop = .1, speed = 2, id = 800) {
  return { dt: now + hours * 3600, main: { temp, temp_min: temp - 1, temp_max: temp + 1 }, wind: { speed }, weather: [{ id }], pop };
}
test('daily forecast aggregates all available slots in the destination timezone', () => {
  const days = groupForecast({ city: { timezone: 7200 }, list: [item(1, 10), item(2, 20), item(3, 15)] });
  assert.equal(days.length, 2);
  assert.equal(days[0].key, '2026-11-05');
  assert.equal(days[1].key, '2026-11-06');
  assert.equal(days[1].min, 14);
  assert.equal(days[1].max, 21);
});
test('activity suggestions exclude storms, snow, rain, gusts and past samples', () => {
  const windy = item(6); windy.wind.gust = 15;
  const data = { list: [item(-1), item(1, 18, .9), item(2, 18, .1, 2, 200), item(3, 18, .1, 2, 600), windy, item(4)] };
  assert.deepEqual(activitySlots(data, 'walk', 'metric', now).map(x => x.dt), [item(4).dt]);
});
test('activity scoring uses consistent physical units for imperial data', () => {
  assert.equal(activitySlots({ list: [item(1, 68, .1, 4.47)] }, 'run', 'imperial', now).length, 1);
  assert.equal(activitySlots({ list: [item(1, 68, .1, 30)] }, 'run', 'imperial', now).length, 0);
});
test('24h summary excludes past and distant samples and sums 3h precipitation', () => {
  const wet = item(4, 20, .7); wet.rain = { '3h': 2.5 };
  const summary = summarizeForecast({ list: [item(-1, -40), wet, item(25, 50), item(6, 15)] }, now);
  assert.equal(summary.min, 14);
  assert.equal(summary.max, 21);
  assert.equal(summary.rain, 2.5);
  assert.equal(summary.pop, 70);
});
