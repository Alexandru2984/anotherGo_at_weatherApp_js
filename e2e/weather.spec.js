import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockWeather } from './fixtures.js';

const loaded = page => expect(page.locator('#weather-info')).toBeVisible();
async function workerReady(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
}
test('first visit is useful and does not request location or weather automatically', async ({ page, context }) => {
  const state = await mockWeather(context);
  await page.addInitScript(() => { window.locationRequests = 0; navigator.geolocation.getCurrentPosition = () => window.locationRequests++; });
  await page.goto('/');
  await expect(page.locator('#welcome')).toBeVisible();
  expect(await page.evaluate(() => window.locationRequests)).toBe(0);
  expect(state.requests).toHaveLength(0);
  await page.locator('[data-city="București,RO"]').click();
  await loaded(page);
  await expect(page.locator('#city-name')).toContainText('București');
});
test('days, chart metrics, keyboard cursor and activity planner work', async ({ page, context }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page);
  const day = page.locator('.forecast-card').nth(1); await day.click();
  await expect(day).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-metric="rain"]').click();
  await expect(page.locator('[data-metric="rain"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#chart-cursor').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#chart-cursor')).toHaveValue('1');
  await expect(page.locator('#chart-reading')).not.toBeEmpty();
  await page.locator('#activity-select').selectOption('bike');
  await expect(page.locator('#activity-criteria')).toContainText('8–30°C');
  expect(await page.locator('.activity-result').count()).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('optional API failures preserve current weather and show the missing-data state', async ({ page, context }) => {
  await mockWeather(context, { optionalFailure: true });
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await expect(page.locator('#partial-status')).toBeVisible();
  await expect(page.locator('#forecast-section')).toBeHidden();
  await expect(page.locator('#air-quality')).toBeHidden();
});
test('a late response cannot overwrite a newer city search', async ({ page, context }) => {
  const state = await mockWeather(context, { delayLat: 44.43 });
  await page.goto('/?city=Bucuresti');
  await expect.poll(() => state.weatherCalls).toBeGreaterThan(0);
  await page.locator('#city-input').fill('Paris');
  await page.locator('#search-form button').click();
  await expect(page.locator('#city-name')).toContainText('Paris');
  await expect(page.locator('#loading-spinner')).toBeHidden();
  // Let the superseded response arrive; no real network requests are involved.
  await page.waitForTimeout(900);
  await expect(page.locator('#city-name')).toContainText('Paris');
});
test('favorites retain coordinates, preferences translate and failed unit refresh stays consistent', async ({ page, context }) => {
  const state = await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await page.locator('#save-favorite').click();
  await expect(page.locator('#save-favorite')).toHaveAttribute('aria-pressed', 'true');
  const favorites = await page.evaluate(() => JSON.parse(localStorage.getItem('favoriteCities')));
  expect(favorites[0].lat).toBe(44.43);
  await page.locator('#lang-select').selectOption('en');
  await expect(page.locator('#connection-status')).toHaveText('Online');
  await expect(page.locator('#description')).toHaveText('clear sky');
  await page.locator('#temp-toggle').check();
  await expect(page.locator('#temperature')).toHaveText('68');
  await expect(page.locator('#data-status')).toContainText('°F');
  state.failWeather = true;
  // The app intentionally restores the checkbox after a failed refresh.
  // click() permits that immediate rollback; uncheck() asserts the transient state.
  await page.locator('#temp-toggle').click();
  await expect(page.locator('#error-message')).toBeVisible();
  await expect(page.locator('#temp-toggle')).toBeChecked();
  await expect(page.locator('#temperature')).toHaveText('68');
});
test('denied storage does not break startup', async ({ page, context }) => {
  await mockWeather(context);
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Denied'); } }));
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await page.locator('#save-favorite').click();
  await expect(page.locator('#save-favorite')).toHaveAttribute('aria-pressed', 'true');
});
test('offline reload restores the shell and matching city without caching API responses', async ({ page, context }) => {
  const state = await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page); await workerReady(page);
  await page.evaluate(() => caches.open('another-app-keep'));
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys(); const cache = await caches.open(keys.find(key => key.startsWith('weather-app-')));
    return (await cache.keys()).map(request => request.url);
  });
  expect(cached.some(url => url.includes('/api/'))).toBe(false);
  state.offline = true;
  await context.setOffline(true);
  await page.reload();
  await loaded(page);
  await expect(page.locator('#connection-status')).toHaveText('Offline');
  await expect(page.locator('#data-status')).toContainText('Date salvate');
  await page.locator('#city-input').fill('Paris'); await page.locator('#search-form button').click();
  await expect(page.locator('#error-message')).toBeVisible();
  await expect(page.locator('#city-name')).toContainText('București');
  expect(await page.evaluate(() => caches.has('another-app-keep'))).toBe(true);
});
test('stale provider data stays visibly marked', async ({ page, context }) => {
  await mockWeather(context, { stale: true });
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await expect(page.locator('#data-status')).toContainText('Date mai vechi');
  await expect(page.locator('#data-status')).toContainText('15 min');
});
test('service worker preserves genuine 404s and theme/accessibility remain usable', async ({ page, context }) => {
  await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page); await workerReady(page);
  await page.locator('#theme-select').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  const response = await page.goto('/this-page-does-not-exist');
  expect(response.status()).toBe(404);
});

test('corrupt saved data is ignored and sharing retains the selected coordinates', async ({ page, context }) => {
  await mockWeather(context);
  await page.addInitScript(() => {
    localStorage.setItem('lastWeatherSnapshot', '{invalid-json');
    localStorage.setItem('favoriteCities', JSON.stringify([null, 42, { name: 'broken', lat: null }]));
    navigator.share = async data => { window.sharedWeather = data; };
  });
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await page.locator('#share-weather').click();
  const shared = new URL(await page.evaluate(() => window.sharedWeather.url));
  expect(shared.searchParams.get('lat')).toBe('44.43');
  expect(shared.searchParams.get('lon')).toBe('26.1');
  await expect(page.locator('#favorite-searches')).toBeHidden();
});
test('clearing local data removes the saved forecast and favorites', async ({ page, context }) => {
  await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page);
  await page.locator('#save-favorite').click();
  await page.locator('#clear-local-data').click();
  await expect(page.locator('#welcome')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lastWeatherSnapshot'))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem('favoriteCities'))).toBe(null);
});
test('all themes have accessible contrast for primary content', async ({ page, context }) => {
  test.setTimeout(60_000);
  await mockWeather(context);
  await page.goto('/?city=Bucuresti'); await loaded(page);
  for (const theme of ['auto', 'light', 'neon', 'modern', 'playful']) {
    await page.locator('#theme-select').selectOption(theme);
    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(results.violations, theme).toEqual([]);
  }
});
