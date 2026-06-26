// scripts/api.js
// Acest modul gestionează interacțiunile cu API-ul OpenWeatherMap.

import {
    OPENWEATHER_API_KEY,
    OPENWEATHER_PROXY_BASE_URL,
    OPENWEATHER_BASE_URL,
    OPENWEATHER_GEO_URL,
  } from './config.js?v=20260626-2'; // Importă constantele din config.js (sunt în același folder scripts/)

  const REQUEST_TIMEOUT_MS = 8000;

  function isValidLatitude(value) {
    return Number.isFinite(value) && value >= -90 && value <= 90;
  }

  function isValidLongitude(value) {
    return Number.isFinite(value) && value >= -180 && value <= 180;
  }

  function normalizeCity(city) {
    const normalizedCity = String(city || '').trim().replace(/\s+/g, ' ');

    if (!normalizedCity || normalizedCity.length > 80) {
      throw new Error('Numele orașului este invalid.');
    }

    return normalizedCity;
  }

  function normalizeLanguage(lang) {
    return ['ro', 'en'].includes(lang) ? lang : 'ro';
  }

  function normalizeUnits(units) {
    return units === 'imperial' ? 'imperial' : 'metric';
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Eroare HTTP! status: ${res.status}`);
      }

      return res.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Cererea către serviciul meteo a expirat.');
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function buildOpenWeatherUrl(path, params) {
    const sanitizedParams = new URLSearchParams(params);

    if (OPENWEATHER_PROXY_BASE_URL) {
      return `${OPENWEATHER_PROXY_BASE_URL}/${path}?${sanitizedParams.toString()}`;
    }

    if (!OPENWEATHER_API_KEY) {
      throw new Error('Cheia API OpenWeatherMap lipsește sau proxy-ul nu este configurat.');
    }

    sanitizedParams.set('appid', OPENWEATHER_API_KEY);
    const baseUrl = path === 'geo/direct' ? OPENWEATHER_GEO_URL : OPENWEATHER_BASE_URL;
    const upstreamPath = path === 'geo/direct' ? 'direct' : path;
    return `${baseUrl}/${upstreamPath}?${sanitizedParams.toString()}`;
  }

  async function resolveCoordinates({ city, lat, lon }) {
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (city) {
      const geoUrl = buildOpenWeatherUrl('geo/direct', {
        q: normalizeCity(city),
        limit: '1',
      });
      const geoData = await fetchJson(geoUrl);
      if (!Array.isArray(geoData) || geoData.length === 0) {
        throw new Error('Orașul nu a fost găsit.');
      }

      return {
        lat: geoData[0].lat,
        lon: geoData[0].lon,
      };
    }

    if (!isValidLatitude(parsedLat) || !isValidLongitude(parsedLon)) {
      throw new Error('Coordonatele sau numele orașului sunt necesare pentru a extrage vremea.');
    }

    return {
      lat: parsedLat,
      lon: parsedLon,
    };
  }
  
  /**
   * Caută sugestii de orașe prin OpenWeatherMap Geocoding API.
   * @param {string} query - Textul introdus de utilizator.
   * @returns {Promise<Array<{name: string, country: string, state?: string, lat: number, lon: number}>>}
   */
  export async function searchCitySuggestions(query) {
    const geoUrl = buildOpenWeatherUrl('geo/direct', {
      q: normalizeCity(query),
      limit: '5',
    });
    const geoData = await fetchJson(geoUrl);

    if (!Array.isArray(geoData)) {
      return [];
    }

    return geoData.map((city) => ({
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
    }));
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
    const coordinates = await resolveCoordinates({ city, lat, lon });
    const url = buildOpenWeatherUrl('weather', {
      lat: String(coordinates.lat),
      lon: String(coordinates.lon),
      units: normalizeUnits(units),
      lang: normalizeLanguage(lang),
    });
    return fetchJson(url);
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
    const coordinates = await resolveCoordinates({ city, lat, lon });
    const url = buildOpenWeatherUrl('forecast', {
      lat: String(coordinates.lat),
      lon: String(coordinates.lon),
      units: normalizeUnits(units),
      lang: normalizeLanguage(lang),
    });
    return fetchJson(url);
  }

  /**
   * Extrage date despre calitatea aerului de la OpenWeatherMap Air Pollution API.
   * @param {Object} options - Opțiuni pentru calitatea aerului.
   * @param {string} [options.city] - Numele orașului.
   * @param {number} [options.lat] - Latitudine.
   * @param {number} [options.lon] - Longitudine.
   * @returns {Promise<Object>} Datele despre calitatea aerului.
   */
  export async function fetchAirQualityData({ city, lat, lon }) {
    const coordinates = await resolveCoordinates({ city, lat, lon });
    const url = buildOpenWeatherUrl('air_pollution', {
      lat: String(coordinates.lat),
      lon: String(coordinates.lon),
    });
    return fetchJson(url);
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
    const coordinates = await resolveCoordinates({ city, lat, lon });
    const weatherPromise = fetchWeatherData({ ...coordinates, units, lang });
    const forecastPromise = fetchForecastData({ ...coordinates, units, lang });
    const airQualityPromise = fetchAirQualityData(coordinates);
  
    const [weather, forecast, airQuality] = await Promise.all([
      weatherPromise,
      forecastPromise,
      airQualityPromise,
    ]);
    return { weather, forecast, airQuality };
  }
  
