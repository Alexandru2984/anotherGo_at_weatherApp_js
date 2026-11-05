import { DEFAULT_UNIT, MAX_FAVORITE_CITIES, MAX_RECENT_SEARCHES, STORAGE_KEYS } from './config.js?v=20261105-4';
import { storage, readJson } from './storage.js?v=20261105-4';
import * as ui from './ui.js?v=20261105-4';
import { getUserLocation } from './utils.js?v=20261105-4';
import * as api from './api.js?v=20261105-4';

const $ = selector => document.querySelector(selector);
let units = storage.getItem(STORAGE_KEYS.TEMPERATURE_UNIT) === 'imperial' ? 'imperial' : DEFAULT_UNIT;
let language = storage.getItem(STORAGE_KEYS.LANGUAGE) === 'en' ? 'en' : 'ro';
let recent = readLocations(STORAGE_KEYS.RECENT_SEARCHES, MAX_RECENT_SEARCHES);
let favorites = readLocations(STORAGE_KEYS.FAVORITE_CITIES, MAX_FAVORITE_CITIES);
let current = null;
let rendered = null;
let renderedSaved = false;
let intent = 0;
let controller;
let suggestionController;
let suggestionTimer;
let suggestions = [];
const cleanName = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 80);
function readLocations(key, limit) {
  const value = readJson(key, []);
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map(item => typeof item === 'string' ? { name: item, label: item } : item).filter(item => item && typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 80 && (item.lat === undefined || api.validCoordinates(item.lat, item.lon))).map(item => ({ name: item.name, country: typeof item.country === "string" ? item.country.slice(0, 2) : undefined, label: typeof item.label === 'string' ? item.label.slice(0, 160) : item.name, ...(api.validCoordinates(item.lat, item.lon) ? { lat: item.lat, lon: item.lon } : {}) }));
}
function locationKey(location) {
  return api.validCoordinates(location?.lat, location?.lon) ? `${location.lat.toFixed(2)},${location.lon.toFixed(2)}` : cleanName(location?.name || location?.city).toLocaleLowerCase();
}
function requestFor(location) {
  return api.validCoordinates(location.lat, location.lon) ? { lat: location.lat, lon: location.lon, name: location.name, country: location.country } : { city: cleanName(location.city || location.name) };
}
function updateLists() {
  ui.updateRecentSearchesList(recent, displayWeather, location => { recent = recent.filter(item => locationKey(item) !== locationKey(location)); saveLists(); });
  ui.updateFavoriteCitiesList(favorites, displayWeather, location => { favorites = favorites.filter(item => locationKey(item) !== locationKey(location)); saveLists(); });
  const saved = current && favorites.some(item => locationKey(item) === locationKey(current));
  $('#save-favorite').setAttribute('aria-pressed', String(Boolean(saved)));
  $('#save-favorite span').textContent = ui.t(saved ? 'removeFavorite' : 'saveFavorite');
}
function saveLists() {
  storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recent));
  storage.setItem(STORAGE_KEYS.FAVORITE_CITIES, JSON.stringify(favorites));
  updateLists();
}
function applyPreferences() {
  $('#temp-toggle').checked = units === 'imperial';
  $('#lang-select').value = language;
  storage.setItem(STORAGE_KEYS.LANGUAGE, language);
  ui.applyStaticUITranslations(language);
  ui.updateTemperatureUnitDisplay(units);
  updateLists();
  ui.updateConnectionStatus();
}
function readSnapshot() {
  const snapshot = readJson(STORAGE_KEYS.LAST_WEATHER);
  if (!snapshot || !api.validWeather(snapshot.data?.weather) || (snapshot.data.forecast !== null && !api.validForecast(snapshot.data.forecast)) || !['metric', 'imperial'].includes(snapshot.units) || !['ro', 'en'].includes(snapshot.language) || !Number.isFinite(snapshot.savedAt) || snapshot.savedAt > Date.now() + 300_000 || Date.now() - snapshot.savedAt > 86_400_000) return null;
  return snapshot;
}
function snapshotMatches(snapshot, location) {
  if (!snapshot || snapshot.units !== units || snapshot.language !== language) return false;
  if (!location) return true;
  const weather = snapshot.data.weather;
  if (api.validCoordinates(location.lat, location.lon)) return Math.abs(weather.coord.lat - location.lat) < 0.02 && Math.abs(weather.coord.lon - location.lon) < 0.02;
  const normalize = value => cleanName(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
  const query = normalize(location.city || location.name);
  return normalize(weather.name) === query || (typeof snapshot.request?.city === 'string' && normalize(snapshot.request.city) === query);
}
function render(snapshot, saved = false) {
  rendered = snapshot;
  renderedSaved = saved;
  const weather = snapshot.data.weather;
  current = { name: weather.name, label: [weather.name, weather.sys?.country].filter(Boolean).join(', '), country: weather.sys?.country, lat: weather.coord.lat, lon: weather.coord.lon };
  ui.displayWeatherData(weather, snapshot.data.forecast, snapshot.data.airQuality, snapshot.units);
  ui.updateDataStatus(snapshot, { saved, offline: !navigator.onLine });
  $('#welcome').classList.add('hidden');
  updateLists();
}
async function displayWeather(location) {
  const sequence = ++intent;
  controller?.abort();
  controller = new AbortController();
  const requestedUnits = units;
  const requestedLanguage = language;
  ui.showLoading();
  try {
    const data = await api.fetchWeatherAndForecast({ ...requestFor(location), units: requestedUnits, lang: requestedLanguage, signal: controller.signal });
    if (sequence !== intent) return;
    const snapshot = { data, request: requestFor(location), units: requestedUnits, language: requestedLanguage, savedAt: Date.now() };
    render(snapshot);
    recent = [current, ...recent.filter(item => locationKey(item) !== locationKey(current))].slice(0, MAX_RECENT_SEARCHES);
    saveLists();
    storage.setItem(STORAGE_KEYS.LAST_WEATHER, JSON.stringify(snapshot));
    $('#city-input').value = '';
    suggestions = [];
    ui.updateCitySuggestions([], $('#city-suggestions'));
  } catch (error) {
    if (sequence !== intent || error.name === 'AbortError') return;
    const snapshot = readSnapshot();
    if (!navigator.onLine && snapshotMatches(snapshot, location)) {
      render(snapshot, true);
    } else {
      // Preserve the previously displayed city, including its actual units/language.
      if (rendered) {
        renderedSaved = true;
        units = rendered.units;
        language = rendered.language;
        storage.setItem(STORAGE_KEYS.TEMPERATURE_UNIT, units);
        applyPreferences();
        ui.updateDataStatus(rendered, { saved: true, offline: !navigator.onLine });
      }
      ui.showError(!navigator.onLine ? 'offlineSearch' : error.code || 'dataFetchError');
    }
  } finally {
    if (sequence === intent) ui.hideLoading();
  }
}
function initialLocation() {
  const params = new URLSearchParams(location.search);
  const lat = params.get('lat');
  const lon = params.get('lon');
  if (lat !== null && lat.trim() && lon !== null && lon.trim() && api.validCoordinates(Number(lat), Number(lon))) return { lat: Number(lat), lon: Number(lon), name: cleanName(params.get('city')) || undefined };
  const city = cleanName(params.get('city'));
  if (city) return { city };
  const snapshot = readSnapshot();
  if (snapshot) return { lat: snapshot.data.weather.coord.lat, lon: snapshot.data.weather.coord.lon };
  return recent[0] || null;
}
async function locate() {
  const sequence = ++intent;
  controller?.abort();
  ui.hideLoading();
  $('#get-location').disabled = true;
  try {
    const position = await getUserLocation();
    if (sequence === intent) await displayWeather(position);
  } catch { if (sequence === intent) ui.showError('locationError'); }
  finally { $('#get-location').disabled = false; }
}
async function share() {
  if (!current) return;
  const url = new URL(location.origin + '/');
  url.searchParams.set('lat', String(current.lat));
  url.searchParams.set('lon', String(current.lon));
  url.searchParams.set('city', current.name);
  try {
    if (navigator.share) await navigator.share({ title: 'Vremea', text: current.label, url: url.href });
    else { await navigator.clipboard.writeText(url.href); ui.showToast('linkCopied'); }
  } catch (error) { if (error.name !== 'AbortError') ui.showError('linkCopyError'); }
}
$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = cleanName($('#city-input').value);
  if (!text) return ui.showError('enterCityNameError');
  const selected = suggestions.find(item => [item.name, item.state, item.country].filter(Boolean).join(', ') === text);
  displayWeather(selected || { city: text });
});
$('#city-input').addEventListener('input', () => {
  clearTimeout(suggestionTimer);
  suggestionController?.abort();
  suggestions = [];
  ui.updateCitySuggestions([], $('#city-suggestions'));
  const query = cleanName($('#city-input').value);
  if (query.length < 3 || !navigator.onLine) return;
  suggestionTimer = setTimeout(async () => {
    const request = new AbortController();
    suggestionController = request;
    try {
      const data = await api.searchCitySuggestions(query, { signal: request.signal });
      if ($('#city-input').value.trim() === query && !request.signal.aborted) { suggestions = data; ui.updateCitySuggestions(data, $('#city-suggestions')); }
    } catch { /* Manual search remains available. */ }
  }, 400);
});
$('#get-location').addEventListener('click', locate);
$('#refresh-weather').addEventListener('click', () => { if (current) displayWeather(current); });
$('#save-favorite').addEventListener('click', () => {
  if (!current) return;
  const key = locationKey(current);
  favorites = favorites.some(item => locationKey(item) === key) ? favorites.filter(item => locationKey(item) !== key) : [current, ...favorites].slice(0, MAX_FAVORITE_CITIES);
  saveLists();
});
$('#share-weather').addEventListener('click', share);
$('#clear-favorites').addEventListener('click', () => { favorites = []; saveLists(); });
$('#clear-recent').addEventListener('click', () => { recent = []; saveLists(); });
$('#temp-toggle').addEventListener('change', () => {
  units = $('#temp-toggle').checked ? 'imperial' : 'metric';
  storage.setItem(STORAGE_KEYS.TEMPERATURE_UNIT, units);
  ui.updateTemperatureUnitDisplay(units);
  if (current) displayWeather(current);
});
$('#lang-select').addEventListener('change', () => {
  language = $('#lang-select').value === 'en' ? 'en' : 'ro';
  applyPreferences();
  if (current) displayWeather(current);
});
$('#theme-select').value = ui.isKnownTheme(storage.getItem(STORAGE_KEYS.THEME)) ? storage.getItem(STORAGE_KEYS.THEME) : 'auto';
$('#theme-select').addEventListener('change', event => {
  storage.setItem(STORAGE_KEYS.THEME, event.target.value);
  ui.applyTheme(event.target.value);
  if (rendered) ui.redrawForecast?.();
});
document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => displayWeather({ city: button.dataset.city })));
$('#clear-local-data').addEventListener('click', () => {
  ++intent;
  controller?.abort();
  suggestionController?.abort();
  clearTimeout(suggestionTimer);
  for (const key of Object.values(STORAGE_KEYS)) storage.removeItem(key);
  history.replaceState(null, '', '/');
  location.reload();
});
function connectionChanged() {
  ui.updateConnectionStatus();
  if (rendered) ui.updateDataStatus(rendered, { saved: renderedSaved || !navigator.onLine, offline: !navigator.onLine });
}
window.addEventListener('online', connectionChanged);
window.addEventListener('offline', connectionChanged);
setInterval(() => { if (rendered) ui.updateDataStatus(rendered, { saved: renderedSaved || !navigator.onLine, offline: !navigator.onLine }); }, 60_000);
applyPreferences();
ui.updateConnectionStatus();
const initial = initialLocation();
const snapshot = readSnapshot();
if (snapshotMatches(snapshot, initial)) render(snapshot, true);
if (initial && navigator.onLine) displayWeather(initial);
else if (!navigator.onLine && !rendered) ui.showError('offlineSearch');
if ('serviceWorker' in navigator) window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw-v4.js', { updateViaCache: 'none' }).catch(() => {});
});
