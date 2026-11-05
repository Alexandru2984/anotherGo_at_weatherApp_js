export const localDateKey = (timestamp, offset = 0) => new Date((timestamp + offset) * 1000).toISOString().slice(0, 10);
export const celsius = (temp, units) => units === 'imperial' ? (temp - 32) * 5 / 9 : temp;
export const metresPerSecond = (wind, units) => units === 'imperial' ? wind / 2.236936 : wind;
export const precipitation = item => Math.max(0, Number(item.rain?.['3h']) || 0) + Math.max(0, Number(item.snow?.['3h']) || 0);
export const probability = item => Math.round(Math.max(0, Math.min(1, Number(item.pop) || 0)) * 100);
export function groupForecast(forecast) {
  const days = new Map();
  const offset = forecast?.city?.timezone || 0;
  for (const item of [...(forecast?.list || [])].sort((a, b) => a.dt - b.dt)) {
    const key = localDateKey(item.dt, offset);
    if (!days.has(key)) days.set(key, { key, items: [] });
    days.get(key).items.push(item);
  }
  return [...days.values()].map(day => ({ ...day,
    min: Math.min(...day.items.map(item => item.main.temp_min)),
    max: Math.max(...day.items.map(item => item.main.temp_max)),
    pop: Math.max(...day.items.map(probability)),
    wind: Math.max(...day.items.map(item => item.wind.speed)),
    rain: day.items.reduce((sum, item) => sum + precipitation(item), 0),
    representative: day.items.reduce((best, item) => Math.abs(new Date((item.dt + offset) * 1000).getUTCHours() - 12) < Math.abs(new Date((best.dt + offset) * 1000).getUTCHours() - 12) ? item : best),
  }));
}
export function summarizeForecast(forecast, now = Date.now() / 1000) {
  const items = (forecast?.list || []).filter(item => item.dt > now && item.dt <= now + 86_400);
  if (!items.length) return null;
  return { min: Math.min(...items.map(item => item.main.temp_min)), max: Math.max(...items.map(item => item.main.temp_max)), pop: Math.max(...items.map(probability)), rain: items.reduce((sum, item) => sum + precipitation(item), 0), wind: Math.max(...items.map(item => item.wind.speed)), samples: items.length };
}
export const ACTIVITY_LIMITS = {
  walk: { min: 0, max: 32, wind: 8, pop: 35, ideal: 20 },
  run: { min: 5, max: 26, wind: 6, pop: 30, ideal: 15 },
  bike: { min: 8, max: 30, wind: 7, pop: 25, ideal: 20 },
};
export function activitySlots(forecast, activity, units = 'metric', now = Date.now() / 1000) {
  const limits = ACTIVITY_LIMITS[activity] || ACTIVITY_LIMITS.walk;
  return (forecast?.list || []).filter(item => {
    const code = item.weather?.[0]?.id || 0;
    const temp = celsius(item.main.temp, units);
    const wind = metresPerSecond(Math.max(item.wind.speed, item.wind.gust || 0), units);
    return item.dt > now && item.dt <= now + 72 * 3600 && temp >= limits.min && temp <= limits.max && wind <= limits.wind && probability(item) <= limits.pop && precipitation(item) <= .5 && !(code >= 200 && code < 300) && !(code >= 600 && code < 700);
  }).map(item => ({ item, score: Math.abs(celsius(item.main.temp, units) - limits.ideal) + probability(item) / 10 + metresPerSecond(item.wind.speed, units) }))
    .sort((a, b) => a.score - b.score || a.item.dt - b.item.dt).slice(0, 3).sort((a, b) => a.item.dt - b.item.dt).map(result => result.item);
}
