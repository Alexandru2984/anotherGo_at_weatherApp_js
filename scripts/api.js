import { OPENWEATHER_PROXY_BASE_URL } from './config.js?v=20261105-3';

export class WeatherError extends Error {
  constructor(code, status = 0) { super(code); this.name = 'WeatherError'; this.code = code; this.status = status; }
}
export function validCoordinates(lat, lon) {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 && typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}
export function validWeather(data) {
  return Boolean(data && typeof data.name === 'string' && Number.isFinite(data.dt) && Number.isFinite(data.timezone) && Number.isFinite(data.main?.temp) && Number.isFinite(data.main?.feels_like) && Number.isFinite(data.main?.humidity) && Number.isFinite(data.main?.pressure) && Number.isFinite(data.wind?.speed) && validCoordinates(data.coord?.lat, data.coord?.lon) && Array.isArray(data.weather) && data.weather.length && /^\d{2}[dn]$/.test(data.weather[0].icon));
}
export function validForecast(data) {
  return Array.isArray(data?.list) && data.list.length > 0 && data.list.length <= 40 && data.list.every(item => Number.isFinite(item.dt) && Number.isFinite(item.main?.temp) && Number.isFinite(item.main?.temp_min) && Number.isFinite(item.main?.temp_max) && Number.isFinite(item.wind?.speed) && /^\d{2}[dn]$/.test(item.weather?.[0]?.icon));
}
async function fetchJson(path, params, signal) {
  const timeout = AbortSignal.timeout(12_000);
  let response;
  try {
    response = await fetch(`${OPENWEATHER_PROXY_BASE_URL}/${path}?${new URLSearchParams(params)}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin',
    });
    if (!response.ok) throw new WeatherError(response.status === 429 ? 'rateLimited' : response.status === 404 ? 'cityNotFound' : 'serviceUnavailable', response.status);
    const data = await response.json();
    if (data && !Array.isArray(data)) {
      const age = Math.max(0, Number(response.headers.get('X-Weather-Age')) || 0);
      data._cache = { stale: response.headers.get('X-Weather-Cache') === 'STALE', fetchedAt: Date.now() - age * 1000 };
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (timeout.aborted) throw new WeatherError('requestTimeout');
    throw error;
  }
}
function cityName(value) {
  const name = String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 80 || /[\u0000-\u001f\u007f<>]/.test(name)) throw new WeatherError('enterCityNameError');
  return name;
}
export async function searchCitySuggestions(query, { signal } = {}) {
  const data = await fetchJson('geo/direct', { q: cityName(query), limit: '5' }, signal);
  if (!Array.isArray(data)) throw new WeatherError('serviceUnavailable');
  return data.filter(city => typeof city.name === 'string' && validCoordinates(city.lat, city.lon)).map(city => ({ name: city.name, country: city.country || '', state: city.state || '', lat: city.lat, lon: city.lon }));
}
async function resolveCoordinates({ city, lat, lon, signal, lang = 'ro', name, country }) {
  if (city) {
    const data = await fetchJson('geo/direct', { q: cityName(city), limit: '1' }, signal);
    if (!Array.isArray(data) || !data.length) throw new WeatherError('cityNotFound');
    if (!validCoordinates(data[0].lat, data[0].lon)) throw new WeatherError('serviceUnavailable');
    return { lat: data[0].lat, lon: data[0].lon, name: data[0].local_names?.[lang] || data[0].name, country: data[0].country };
  }
  if (!validCoordinates(lat, lon)) throw new WeatherError('invalidLocation');
  return { lat, lon, name, country };
}
function requestOptions({ lat, lon, units = 'metric', lang = 'ro' }) {
  return { lat: String(lat), lon: String(lon), units: units === 'imperial' ? 'imperial' : 'metric', lang: lang === 'en' ? 'en' : 'ro' };
}
export async function fetchWeatherAndForecast(options) {
  const coordinates = await resolveCoordinates(options);
  const params = requestOptions({ ...options, ...coordinates });
  const [weather, forecast, airQuality] = await Promise.allSettled([
    fetchJson('weather', params, options.signal),
    fetchJson('forecast', params, options.signal),
    fetchJson('air_pollution', { lat: params.lat, lon: params.lon }, options.signal),
  ]);
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (weather.status !== 'fulfilled') throw weather.reason;
  if (!validWeather(weather.value)) throw new WeatherError('serviceUnavailable');
  if (coordinates.name) weather.value.name = String(coordinates.name).slice(0, 80);
  if (coordinates.country && weather.value.sys) weather.value.sys.country = coordinates.country;
  return {
    weather: weather.value,
    forecast: forecast.status === 'fulfilled' && validForecast(forecast.value) ? forecast.value : null,
    airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
  };
}
