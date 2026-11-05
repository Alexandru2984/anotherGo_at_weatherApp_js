import { weatherIconUrl } from './config.js?v=20261105-5';
import { groupForecast, summarizeForecast, activitySlots, ACTIVITY_LIMITS, probability, localDateKey } from './forecast.js?v=20261105-5';
import { storage } from './storage.js?v=20261105-5';
const $ = selector => document.querySelector(selector);
const make = (tag, className, text) => { const element = document.createElement(tag); element.className = className; if (text !== undefined) element.textContent = text; return element; };
let state;
let selectedDay;
let selectedPoint = 0;
let cityKey;
let metric = ['temp', 'rain', 'wind'].includes(storage.getItem('chartMetric')) ? storage.getItem('chartMetric') : 'temp';
let activity = Object.hasOwn(ACTIVITY_LIMITS, storage.getItem('activityPreference')) ? storage.getItem('activityPreference') : 'walk';
const windUnit = () => state.units === 'imperial' ? 'mph' : 'm/s';
const tempUnit = () => state.units === 'imperial' ? '°F' : '°C';
function format(timestamp, date = false) {
  return new Date((timestamp + (state.forecast.city?.timezone || 0)) * 1000).toLocaleString(state.lang === 'en' ? 'en-GB' : 'ro-RO', { timeZone: 'UTC', ...(date ? { weekday: 'short', day: 'numeric', month: 'short' } : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) });
}
function icon(item, className) {
  const image = make('img', className);
  image.src = weatherIconUrl(item.weather[0].icon);
  image.alt = item.weather[0].description || '';
  image.width = 48; image.height = 48; image.loading = 'lazy';
  return image;
}
function points() { return state.days.find(day => day.key === selectedDay)?.items || []; }
function renderDays() {
  const list = $('#forecast-list'); list.replaceChildren();
  for (const day of state.days) {
    const button = make('button', 'forecast-card'); button.type = 'button';
    button.setAttribute('aria-pressed', String(day.key === selectedDay));
    const today = localDateKey(Date.now() / 1000, state.forecast.city?.timezone || 0);
    button.append(make('span', 'forecast-day', day.key === today ? state.t('today') : format(day.items[0].dt, true)), icon(day.representative, 'forecast-icon'), make('strong', 'forecast-temp', `${Math.round(day.max)}°`), make('span', 'forecast-low', `${state.t('minimum')} ${Math.round(day.min)}°`), make('span', 'forecast-meta', `☂ ${day.pop}% · ${day.rain.toFixed(1)} mm`));
    button.setAttribute('aria-label', `${format(day.items[0].dt, true)}, ${Math.round(day.min)}–${Math.round(day.max)}${tempUnit()}, ${state.t('rainProbability')} ${day.pop}%`);
    button.addEventListener('click', () => { selectedDay = day.key; selectedPoint = 0; renderDays(); renderSelected(); });
    list.append(button);
  }
}
function renderSelected() {
  $('#selected-day').textContent = format(points()[0].dt, true);
  const list = $('#hourly-forecast'); list.replaceChildren();
  points().forEach((item, index) => {
    const card = make('button', 'hourly-card'); card.type = 'button';
    card.setAttribute('aria-pressed', String(index === selectedPoint));
    card.append(make('span', 'hourly-time', format(item.dt)), icon(item, 'hourly-icon'), make('strong', 'hourly-temp', `${Math.round(item.main.temp)}°`), make('span', 'hourly-meta', `☂ ${probability(item)}%`), make('span', 'hourly-meta', `${item.wind.speed.toFixed(1)} ${windUnit()}`));
    card.addEventListener('click', () => selectPoint(index));
    list.append(card);
  });
  $('#chart-cursor').max = String(points().length - 1);
  $('#chart-cursor').value = String(Math.min(selectedPoint, points().length - 1));
  $('#chart-cursor').disabled = points().length < 2;
  $('#chart-cursor').setAttribute('aria-label', state.t('exploreChart'));
  document.querySelectorAll('[data-metric]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.metric === metric)); });
  selectPoint(selectedPoint);
}
function selectPoint(index) {
  const items = points();
  selectedPoint = Math.max(0, Math.min(items.length - 1, index));
  const item = items[selectedPoint];
  $('#chart-cursor').value = String(selectedPoint);
  const reading = `${format(item.dt)} · ${Math.round(item.main.temp)}${tempUnit()} · ☂ ${probability(item)}% · ${item.wind.speed.toFixed(1)} ${windUnit()}`;
  $('#chart-reading').textContent = reading;
  $('#chart-cursor').setAttribute('aria-valuetext', reading);
  document.querySelectorAll('.hourly-card').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedPoint)));
  drawChart();
}
function drawChart() {
  if (!state || !points().length) return;
  const canvas = $('#temperature-chart'); const ctx = canvas.getContext('2d');
  const width = canvas.getBoundingClientRect().width; if (!ctx || width < 1) return;
  const height = 210; const dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.scale(dpr, dpr);
  const items = points(); const values = items.map(item => metric === 'rain' ? probability(item) : metric === 'wind' ? item.wind.speed : item.main.temp);
  const low = metric === 'rain' || metric === 'wind' ? 0 : Math.floor(Math.min(...values) - 2);
  const high = metric === 'rain' ? 100 : Math.max(low + 2, Math.ceil(Math.max(...values) + 2));
  const style = getComputedStyle(document.documentElement); const accent = style.getPropertyValue('--primary-color').trim(); const muted = style.getPropertyValue('--light-text-color').trim();
  const left = 42, right = width - 25, top = 22, bottom = height - 30;
  const x = i => items.length === 1 ? (left + right) / 2 : left + i / (items.length - 1) * (right - left);
  const y = value => bottom - (value - low) / (high - low) * (bottom - top);
  ctx.font = '11px system-ui'; ctx.fillStyle = muted; ctx.textAlign = 'right';
  for (let i = 0; i < 4; i++) {
    const value = low + (high - low) * i / 3;
    ctx.fillText(`${Math.round(value)}${metric === 'rain' ? '%' : metric === 'temp' ? '°' : ''}`, left - 8, y(value) + 4);
    ctx.beginPath(); ctx.strokeStyle = 'rgba(128,128,128,.15)'; ctx.moveTo(left, y(value)); ctx.lineTo(right, y(value)); ctx.stroke();
  }
  ctx.beginPath(); items.forEach((_item, i) => i ? ctx.lineTo(x(i), y(values[i])) : ctx.moveTo(x(i), y(values[i])));
  ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.strokeStyle = accent; ctx.stroke();
  ctx.lineTo(x(items.length - 1), bottom); ctx.lineTo(x(0), bottom); ctx.closePath(); ctx.fillStyle = accent; ctx.globalAlpha = .10; ctx.fill(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.fillStyle = muted;
  items.forEach((item, i) => { if ((width < 400 ? [0, Math.floor((items.length - 1) / 2), items.length - 1].includes(i) : i % Math.max(1, Math.ceil(items.length / 4)) === 0 || i === items.length - 1)) ctx.fillText(format(item.dt), x(i), height - 8); });
  ctx.beginPath(); ctx.moveTo(x(selectedPoint), top); ctx.lineTo(x(selectedPoint), bottom); ctx.lineWidth = 1; ctx.strokeStyle = accent; ctx.stroke();
  ctx.beginPath(); ctx.arc(x(selectedPoint), y(values[selectedPoint]), 5, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
  canvas.setAttribute('aria-label', `${state.t(metric === 'temp' ? 'temperatureMetric' : metric === 'rain' ? 'rainProbability' : 'wind')}. ${$('#chart-reading').textContent}`);
}
function renderSummary() {
  const summary = summarizeForecast(state.forecast);
  const container = $('#weather-summary'); container.replaceChildren();
  $('#summary-section').classList.toggle('hidden', !summary);
  if (!summary) return;
  for (const [label, value] of [['temperatureRange', `${Math.round(summary.min)}–${Math.round(summary.max)}${tempUnit()}`], ['rainProbability', `${summary.pop}%`], ['rainAmount', `${summary.rain.toFixed(1)} mm`], ['maxWind', `${summary.wind.toFixed(1)} ${windUnit()}`]]) {
    const card = make('div', 'summary-tile'); card.append(make('span', 'summary-label', state.t(label)), make('strong', 'summary-value', value)); container.append(card);
  }
}
function renderActivity() {
  const list = $('#activity-results'); list.replaceChildren();
  const slots = activitySlots(state.forecast, activity, state.units);
  const limits = ACTIVITY_LIMITS[activity];
  const toTemp = value => Math.round(state.units === 'imperial' ? value * 9 / 5 + 32 : value);
  const wind = (state.units === 'imperial' ? limits.wind * 2.236936 : limits.wind).toFixed(1);
  $('#activity-criteria').textContent = `${state.t('criteria')}: ${toTemp(limits.min)}–${toTemp(limits.max)}${tempUnit()} · ${state.t('wind')} ≤ ${wind} ${windUnit()} · ☂ ≤ ${limits.pop}% · ${state.t('rainAmount')} ≤ 0.5 mm/3h`;
  if (!slots.length) { list.append(make('p', 'empty-note', state.t('noActivitySlots'))); return; }
  for (const item of slots) {
    const card = make('article', 'activity-result');
    card.append(make('span', 'activity-day', format(item.dt, true)), make('strong', 'activity-time', `${format(item.dt)}–${format(item.dt + 10800)}`), make('span', 'activity-meta', `${Math.round(item.main.temp)}${tempUnit()} · ☂ ${probability(item)}% · ${item.wind.speed.toFixed(1)} ${windUnit()}`)); list.append(card);
  }
}
export function renderForecast(forecast, units, lang, t, weather) {
  for (const id of ['#forecast-section', '#planner-section', '#summary-section']) $(id).classList.toggle('hidden', !forecast?.list?.length);
  if (!forecast?.list?.length) { state = null; return; }
  const key = `${weather.coord.lat},${weather.coord.lon}`;
  const days = groupForecast(forecast);
  if (key !== cityKey || !days.some(day => day.key === selectedDay)) { selectedDay = days[0].key; selectedPoint = 0; }
  cityKey = key;
  state = { forecast, units, lang, t, days };
  $('#activity-select').value = activity;
  renderDays(); renderSelected(); renderSummary(); renderActivity();
}
export function redrawForecast() { if (state) drawChart(); }
$('#chart-cursor').addEventListener('input', event => { if (state) selectPoint(Number(event.target.value)); });
$('#temperature-chart').addEventListener('pointermove', event => {
  if (!state || event.pointerType === 'touch') return;
  const bounds = event.currentTarget.getBoundingClientRect();
  selectPoint(Math.round((event.clientX - bounds.left - 42) / (bounds.width - 67) * (points().length - 1)));
});
document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => { metric = button.dataset.metric; storage.setItem('chartMetric', metric); if (state) renderSelected(); }));
$('#activity-select').addEventListener('change', event => { activity = event.target.value; storage.setItem('activityPreference', activity); if (state) renderActivity(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(redrawForecast).observe($('#temperature-chart'));
