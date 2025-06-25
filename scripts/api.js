// scripts/api.js
// Acest modul gestionează interacțiunile cu API-urile externe (OpenWeatherMap, IP-API).

import {
    OPENWEATHER_API_KEY,
    OPENWEATHER_BASE_URL,
    OPENWEATHER_GEO_URL,
    IP_API_BASE_URL,
  } from './config.js'; // Importă constantele din config.js (sunt în același folder scripts/)
  
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
    let url;
    if (city) {
      // În primul rând, obține coordonatele pentru oraș
      const geoUrl = `${OPENWEATHER_GEO_URL}/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        throw new Error(`Eroare HTTP! status: ${geoRes.status}`);
      }
      const geoData = await geoRes.json();
      if (geoData.length === 0) {
        throw new Error('Orașul nu a fost găsit.');
      }
      lat = geoData[0].lat;
      lon = geoData[0].lon;
    }
  
    if (!lat || !lon) {
      throw new Error('Coordonatele sau numele orașului sunt necesare pentru a extrage vremea.');
    }
  
    // Adaugă parametrul "lang" la URL-ul API
    url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    return res.json();
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
    let url;
    if (city) {
      // În primul rând, obține coordonatele pentru oraș
      const geoUrl = `${OPENWEATHER_GEO_URL}/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        throw new Error(`Eroare HTTP! status: ${geoRes.status}`);
      }
      const geoData = await geoRes.json();
      if (geoData.length === 0) {
        throw new Error('Orașul nu a fost găsit.');
      }
      lat = geoData[0].lat;
      lon = geoData[0].lon;
    }
  
    if (!lat || !lon) {
      throw new Error('Coordonatele sau numele orașului sunt necesare pentru a extrage prognoza.');
    }
  
    // Adaugă parametrul "lang" la URL-ul API
    url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    return res.json();
  }
  
  /**
   * Extrage atât datele meteo curente, cât și datele prognozei.
   * @param {Object} options - Opțiuni pentru extragerea vremii și a prognozei.
   * @param {string} [options.city] - Numele orașului.
   * @param {number} [options.lat] - Latitudine.
   * @param {number} [options.lon] - Longitudine.
   * @param {string} [options.units='metric'] - Unitatea de temperatură (metric, imperial).
   * @param {string} [options.lang='en'] - Limba pentru răspunsurile API.
   * @returns {Promise<{weather: Object, forecast: Object}>} Date combinate de vreme și prognoză.
   */
  export async function fetchWeatherAndForecast({ city, lat, lon, units, lang = 'en' }) {
    const weatherPromise = fetchWeatherData({ city, lat, lon, units, lang });
    const forecastPromise = fetchForecastData({ city, lat, lon, units, lang });
  
    const [weather, forecast] = await Promise.all([weatherPromise, forecastPromise]);
    return { weather, forecast };
  }
  
  /**
   * Extrage date de locație (latitudine și longitudine) pe baza adresei IP.
   * @returns {Promise<{lat: number, lon: number}>} Latitudine și longitudine.
   */
  export async function fetchLocationByIP() {
    const res = await fetch(IP_API_BASE_URL);
    if (!res.ok) {
      throw new Error(`Eroare HTTP! status: ${res.status}`);
    }
    const data = await res.json();
    if (!data.latitude || !data.longitude) {
      throw new Error('Nu s-au putut obține date de locație bazate pe IP.');
    }
    return { lat: data.latitude, lon: data.longitude };
  }
  