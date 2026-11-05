export function fixtures(lat = 44.43, units = 'metric', lang = 'ro') {
  const paris = lat > 48;
  const city = { name: paris ? 'Paris' : 'București', country: paris ? 'FR' : 'RO', lat, lon: paris ? 2.35 : 26.1 };
  const now = Math.floor(Date.now() / 1000);
  const temp = value => units === 'imperial' ? value * 9 / 5 + 32 : value;
  const wind = value => units === 'imperial' ? value * 2.236936 : value;
  const condition = { id: 800, icon: '01d', main: 'Clear', description: lang === 'en' ? 'clear sky' : 'cer senin' };
  const weather = { name: city.name, sys: { country: city.country, sunrise: now - 7200, sunset: now + 24_000 }, coord: { lat: city.lat, lon: city.lon }, dt: now, timezone: 7200, main: { temp: temp(20), feels_like: temp(19), humidity: 60, pressure: 1014 }, wind: { speed: wind(2), deg: 90 }, weather: [condition], visibility: 10_000, clouds: { all: 10 } };
  const start = Math.floor(now / 10800) * 10800 + 10800;
  const forecast = { city: { timezone: 7200 }, list: Array.from({ length: 40 }, (_, index) => ({ dt: start + index * 10800, main: { temp: temp(18 + index % 5), temp_min: temp(16 + index % 5), temp_max: temp(19 + index % 5), humidity: 65 }, wind: { speed: wind(2), gust: wind(3) }, weather: [condition], pop: (index % 5) * .1, rain: { '3h': index % 5 === 4 ? .2 : 0 } })) };
  const air = { list: [{ main: { aqi: 2 }, components: { pm2_5: 4, pm10: 10, o3: 30 } }] };
  return { city, weather, forecast, air };
}
export async function mockWeather(context, options = {}) {
  const state = { offline: false, optionalFailure: false, failWeather: false, stale: false, delayLat: null, weatherCalls: 0, requests: [], ...options };
  await context.route('**/api/openweather/**', async route => {
    const url = new URL(route.request().url());
    state.requests.push(url.href);
    if (state.offline) return route.abort('internetdisconnected');
    const path = url.pathname.split('/').pop();
    const lat = Number(url.searchParams.get('lat') || 44.43);
    const data = fixtures(lat, url.searchParams.get('units'), url.searchParams.get('lang'));
    let body;
    if (path === 'direct') {
      const paris = url.searchParams.get('q').toLowerCase().includes('paris');
      body = [{ ...fixtures(paris ? 48.85 : 44.43).city }];
    } else if (path === 'weather') {
      state.weatherCalls++;
      if (state.delayLat !== null && Math.abs(lat - state.delayLat) < .01) await new Promise(resolve => setTimeout(resolve, 800));
      if (state.failWeather) return route.fulfill({ status: 503, json: { error: 'Unavailable' } }).catch(() => {});
      body = data.weather;
    } else if (state.optionalFailure) return route.fulfill({ status: 502, json: { error: 'Unavailable' } });
    else body = path === 'forecast' ? data.forecast : data.air;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'X-Weather-Cache': state.stale ? 'STALE' : 'MISS', 'X-Weather-Age': state.stale ? '900' : '0' }, body: JSON.stringify(body) }).catch(() => {});
  });
  return state;
}
