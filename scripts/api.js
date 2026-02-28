// scripts/api.js
// Acest modul gestionează interacțiunile cu API-urile externe (OpenWeatherMap, IP-API).

import {
    OPENWEATHER_API_KEY,
    OPENWEATHER_BASE_URL,
    OPENWEATHER_GEO_URL,
    IP_API_BASE_URL,
} from './config.js';

const FETCH_TIMEOUT_MS = 10000; // 10 secunde

/**
 * Wrapper peste fetch() cu timeout automat.
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Parsează JSON dintr-un Response și aruncă eroare clară dacă răspunsul nu e valid JSON.
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function parseJSON(res) {
    try {
        return await res.json();
    } catch {
        throw new Error(`Răspuns invalid de la server (nu este JSON). Status: ${res.status}`);
    }
}

/**
 * Extrage date meteo de la OpenWeatherMap API.
 * @param {Object} options - Opțiuni pentru extragerea vremii.
 * @param {string} [options.city] - Numele orașului.
 * @param {number} [options.lat] - Latitudine.
 * @param {number} [options.lon] - Longitudine.
 * @param {string} [options.units='metric'] - Unitatea de temperatură (metric, imperial).
 * @param {string} [options.lang='en'] - Limba pentru răspunsurile API.
 * @returns {Promise<Object>} Datele meteo.
 */
export async function fetchWeatherData({ city, lat, lon, units = 'metric', lang = 'en' }) {
    if (city) {
        const geoUrl = `${OPENWEATHER_GEO_URL}/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        const geoRes = await fetchWithTimeout(geoUrl);
        if (!geoRes.ok) {
            throw new Error(`Eroare HTTP! status: ${geoRes.status}`);
        }
        const geoData = await parseJSON(geoRes);
        if (geoData.length === 0) {
            throw new Error('Orașul nu a fost găsit.');
        }
        lat = geoData[0].lat;
        lon = geoData[0].lon;
    }

    if (!lat || !lon) {
        throw new Error('Coordonatele sau numele orașului sunt necesare pentru a extrage vremea.');
    }

    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    return parseJSON(res);
}

/**
 * Extrage datele prognozei pe 5 zile de la OpenWeatherMap API.
 * @param {Object} options - Opțiuni pentru extragerea prognozei.
 * @param {string} [options.city] - Numele orașului.
 * @param {number} [options.lat] - Latitudine.
 * @param {number} [options.lon] - Longitudine.
 * @param {string} [options.units='metric'] - Unitatea de temperatură (metric, imperial).
 * @param {string} [options.lang='en'] - Limba pentru răspunsurile API.
 * @returns {Promise<Object>} Datele prognozei.
 */
export async function fetchForecastData({ city, lat, lon, units = 'metric', lang = 'en' }) {
    if (city) {
        const geoUrl = `${OPENWEATHER_GEO_URL}/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        const geoRes = await fetchWithTimeout(geoUrl);
        if (!geoRes.ok) {
            throw new Error(`Eroare HTTP! status: ${geoRes.status}`);
        }
        const geoData = await parseJSON(geoRes);
        if (geoData.length === 0) {
            throw new Error('Orașul nu a fost găsit.');
        }
        lat = geoData[0].lat;
        lon = geoData[0].lon;
    }

    if (!lat || !lon) {
        throw new Error('Coordonatele sau numele orașului sunt necesare pentru a extrage prognoza.');
    }

    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    return parseJSON(res);
}

/**
 * Extrage atât datele meteo curente, cât și datele prognozei.
 * @param {Object} options
 * @returns {Promise<{weather: Object, forecast: Object}>}
 */
export async function fetchWeatherAndForecast({ city, lat, lon, units, lang = 'en' }) {
    const [weather, forecast] = await Promise.all([
        fetchWeatherData({ city, lat, lon, units, lang }),
        fetchForecastData({ city, lat, lon, units, lang }),
    ]);
    return { weather, forecast };
}

/**
 * Extrage date de locație (latitudine și longitudine) pe baza adresei IP.
 * @returns {Promise<{lat: number, lon: number}>}
 */
export async function fetchLocationByIP() {
    const res = await fetchWithTimeout(IP_API_BASE_URL);
    if (!res.ok) {
        throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    const data = await parseJSON(res);
    if (!data.latitude || !data.longitude) {
        throw new Error('Nu s-au putut obține date de locație bazate pe IP.');
    }
    return { lat: data.latitude, lon: data.longitude };
}
