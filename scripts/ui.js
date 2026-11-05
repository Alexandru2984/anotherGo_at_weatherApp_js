import { renderForecast, redrawForecast } from './insights.js?v=20261105-3';
export { redrawForecast };
import { storage } from './storage.js?v=20261105-3';
// scripts/ui.js
// Acest modul gestionează actualizarea interfeței utilizatorului și traducerile.

const UI_elements = {
    loadingSpinner: document.querySelector("#loading-spinner"),
    errorMessage: document.querySelector("#error-message"),
    toast: document.querySelector("#toast"),
    weatherInfo: document.querySelector("#weather-info"),
    cityName: document.querySelector("#city-name"),
    dateTime: document.querySelector("#date-time"),
    temperature: document.querySelector("#temperature"),
    feelsLike: document.querySelector("#feels-like"),
    weatherIcon: document.querySelector("#weather-icon"),
    description: document.querySelector("#description"),
    humidity: document.querySelector("#humidity"),
    windSpeed: document.querySelector("#wind-speed"),
    pressure: document.querySelector("#pressure"),
    visibility: document.querySelector("#visibility"),
    cloudCover: document.querySelector("#cloud-cover"),
    windDirection: document.querySelector("#wind-direction"),
    precipitation: document.querySelector("#precipitation"),
    dewPoint: document.querySelector("#dew-point"),
    sunrise: document.querySelector("#sunrise"),
    sunset: document.querySelector("#sunset"),
    dayLength: document.querySelector("#day-length"),
    moonPhase: document.querySelector("#moon-phase"),
    tempToggle: document.querySelector("#temp-toggle"),
    displayUnit: document.querySelector("#display-unit"), // Acesta este span-ul pentru °F
    recentSearchesList: document.querySelector("#recent-list"),
    tempRange: document.querySelector("#temp-range"),
    tempMinDisplay: document.querySelector("#temp-min"),
    tempMaxDisplay: document.querySelector("#temp-max"),
    tempIndicator: document.querySelector("#temp-indicator"),
    tempCurrentLabel: document.querySelector("#temp-current-label"),
    searchTextInput: document.querySelector(".search-container .input"),
    recentSearchesSection: document.querySelector("#recent-searches"),
    favoriteSearchesSection: document.querySelector("#favorite-searches"),
    favoriteSearchesList: document.querySelector("#favorite-list"),
    forecastSection: document.querySelector("#forecast-section"),
    forecastList: document.querySelector("#forecast-list"),
    hourlyForecast: document.querySelector("#hourly-forecast"),
    temperatureChart: document.querySelector("#temperature-chart"),
    weatherAlerts: document.querySelector("#weather-alerts"),
    airQuality: document.querySelector("#air-quality"),
    airQualityLabel: document.querySelector(".air-quality [data-i18n='airQuality']"),
    aqiLabel: document.querySelector("#aqi-label"),
    aqiIndicator: document.querySelector("#aqi-indicator"),
    pm25: document.querySelector("#pm25"),
    pm10: document.querySelector("#pm10"),
    o3: document.querySelector("#o3"),
    saveFavoriteButton: document.querySelector("#save-favorite"),
    shareWeatherButton: document.querySelector("#share-weather"),
    refreshWeatherButton: document.querySelector("#refresh-weather"),
    clearFavoritesButton: document.querySelector("#clear-favorites span"),
    clearRecentButton: document.querySelector("#clear-recent span"),
    themeSelect: document.querySelector("#theme-select"),
    celsiusLabel: document.querySelector(".unit-toggle > span:first-child"),

    // Elemente pentru traduceri statice
    getGeolocationButton: document.querySelector("#get-location span"),
    getGeolocationButtonTitle: document.querySelector("#get-location"), // Pentru atributul title
    searchPlaceholder: document.querySelector(".search-container .input"), // Pentru placeholder + aria-label
    loadingLabel: document.querySelector("#loading-spinner .sr-only"),
    feelsLikeLabel: document.querySelector(".feels-like span:first-child"),
    humidityLabel: document.querySelector(".weather-details [data-i18n='humidity']"),
    windLabel: document.querySelector(".weather-details [data-i18n='wind']"),
    windUnitLabel: document.querySelector(".weather-details [data-i18n='windUnit']"),
    pressureLabel: document.querySelector(".weather-details [data-i18n='pressure']"),
    pressureUnitLabel: document.querySelector(".weather-details [data-i18n='pressureUnit']"),
    visibilityLabel: document.querySelector(".weather-extra [data-i18n='visibility']"),
    cloudCoverLabel: document.querySelector(".weather-extra [data-i18n='cloudCover']"),
    windDirectionLabel: document.querySelector(".weather-extra [data-i18n='windDirection']"),
    precipitationLabel: document.querySelector(".weather-extra [data-i18n='precipitation']"),
    dewPointLabel: document.querySelector(".weather-extra [data-i18n='dewPoint']"),
    sunriseLabel: document.querySelector(".sun-times [data-i18n='sunrise']"),
    sunsetLabel: document.querySelector(".sun-times [data-i18n='sunset']"),
    dayLengthLabel: document.querySelector(".sun-times [data-i18n='dayLength']"),
    moonPhaseLabel: document.querySelector(".sun-times [data-i18n='moonPhase']"),
    recentSearchesTitle: document.querySelector("#recent-searches h3"),
    favoriteSearchesTitle: document.querySelector("#favorite-searches h3"),
    forecastTitle: document.querySelector("#forecast-section h3"),
    saveFavoriteLabel: document.querySelector("#save-favorite span"),
    copyLinkLabel: document.querySelector("#share-weather span"),
    refreshWeatherLabel: document.querySelector("#refresh-weather span"),
    dataProvidedBy: document.querySelector(".app-footer [data-i18n='dataProvidedBy']"),
    weatherIconAlt: document.querySelector("#weather-icon"), // Pentru atributul alt
  };

  // Obiectul de traduceri
  const TRANSLATIONS = {
    ro: {
      useCurrentLocation: "Folosiți locația curentă",
      currentLocation: "Locația Curentă",
      celsiusSymbol: "°C",
      fahrenheitSymbol: "°F",
      enterCityName: "Introduceți numele orașului",
      feelsLike: "Se simte ca:",
      weatherIconAlt: "Iconiță meteo",
      humidity: "Umiditate",
      wind: "Vânt",
      windUnit: " m/s",
      pressure: "Presiune",
      pressureUnit: " hPa",
      visibility: "Vizibilitate",
      cloudCover: "Nebulozitate",
      windDirection: "Direcție vânt",
      precipitation: "Precipitații",
      none: "Fără",
      dewPoint: "Punct de rouă",
      sunrise: "Răsărit",
      sunset: "Apus",
      dayLength: "Durata zilei",
      moonPhase: "Faza lunii",
      moonNew: "Lună nouă",
      moonWaxingCrescent: "Crai nou crescător",
      moonFirstQuarter: "Primul pătrar",
      moonWaxingGibbous: "Lună crescătoare",
      moonFull: "Lună plină",
      moonWaningGibbous: "Lună descrescătoare",
      moonLastQuarter: "Ultimul pătrar",
      moonWaningCrescent: "Crai nou descrescător",
      airQuality: "Calitatea aerului",
      aqiGood: "Bună",
      aqiFair: "Acceptabilă",
      aqiModerate: "Moderată",
      aqiPoor: "Slabă",
      aqiVeryPoor: "Foarte slabă",
      themeAuto: "Sistem",
      themeDark: "Dark",
      themeLight: "Light",
      themeNeon: "Neon",
      themeModern: "Modern",
      themePlayful: "Playful",
      forecastTitle: "Prognoză pe 5 zile",
      hourlyForecast: "Prognoză pe ore",
      recentSearchesTitle: "Căutări Recente",
      favoriteSearchesTitle: "Favorite",
      saveFavorite: "Favorite",
      removeFavorite: "Favorit salvat",
      copyLink: "Copiază link",
      refreshWeather: "Actualizează",
      clearAll: "Șterge tot",
      removeCity: "Șterge orașul",
      linkCopied: "Linkul a fost copiat.",
      linkCopyError: "Nu am putut copia linkul.",
      loading: "Se încarcă…",
      offlineDataNote: "Date salvate (ești offline).",
      alertThunderstorm: "Risc de furtună în prognoza apropiată.",
      alertHeavyRain: "Ploaie în prognoza apropiată.",
      alertSnow: "Ninsoare în prognoza apropiată.",
      alertHighWind: "Vânt puternic. Verificați condițiile înainte de drum.",
      alertHeat: "Temperaturi ridicate. Hidratarea este importantă.",
      alertFreeze: "Temperaturi sub zero. Atenție la gheață.",
      dataProvidedBy: "Date furnizate de",
      // Mesaje de eroare
      dataFetchError: "Nu am putut obține datele meteo. Verificați numele orașului și încercați din nou.",
      cityNotFound: "Orașul nu a fost găsit. Vă rugăm să introduceți un nume de oraș valid.",
      locationBlocked: "Locația este blocată. Vă rugăm să permiteți accesul la locație în setările browserului.",
      locationError: "Nu am putut obține locația dvs. Vă rugăm să căutați manual un oraș.",
      enterCityNameError: "Vă rugăm să introduceți numele unui oraș", // Mesajul pentru câmp gol la căutare
    },
    en: {
      useCurrentLocation: "Use current location",
      currentLocation: "Current Location",
      celsiusSymbol: "°C",
      fahrenheitSymbol: "°F",
      enterCityName: "Enter city name",
      feelsLike: "Feels like:",
      weatherIconAlt: "Weather icon",
      humidity: "Humidity",
      wind: "Wind",
      windUnit: " m/s",
      pressure: "Pressure",
      pressureUnit: " hPa",
      visibility: "Visibility",
      cloudCover: "Cloud cover",
      windDirection: "Wind direction",
      precipitation: "Precipitation",
      none: "None",
      dewPoint: "Dew point",
      sunrise: "Sunrise",
      sunset: "Sunset",
      dayLength: "Day length",
      moonPhase: "Moon phase",
      moonNew: "New moon",
      moonWaxingCrescent: "Waxing crescent",
      moonFirstQuarter: "First quarter",
      moonWaxingGibbous: "Waxing gibbous",
      moonFull: "Full moon",
      moonWaningGibbous: "Waning gibbous",
      moonLastQuarter: "Last quarter",
      moonWaningCrescent: "Waning crescent",
      airQuality: "Air quality",
      aqiGood: "Good",
      aqiFair: "Fair",
      aqiModerate: "Moderate",
      aqiPoor: "Poor",
      aqiVeryPoor: "Very poor",
      themeAuto: "System",
      themeDark: "Dark",
      themeLight: "Light",
      themeNeon: "Neon",
      themeModern: "Modern",
      themePlayful: "Playful",
      forecastTitle: "5-day forecast",
      hourlyForecast: "Hourly forecast",
      recentSearchesTitle: "Recent Searches",
      favoriteSearchesTitle: "Favorites",
      saveFavorite: "Favorite",
      removeFavorite: "Saved favorite",
      copyLink: "Copy link",
      refreshWeather: "Refresh",
      clearAll: "Clear all",
      removeCity: "Remove city",
      linkCopied: "Link copied.",
      linkCopyError: "Could not copy the link.",
      loading: "Loading…",
      offlineDataNote: "Saved data (you are offline).",
      alertThunderstorm: "Thunderstorm risk in the nearby forecast.",
      alertHeavyRain: "Rain in the nearby forecast.",
      alertSnow: "Snow in the nearby forecast.",
      alertHighWind: "Strong wind. Check conditions before traveling.",
      alertHeat: "High temperatures. Hydration matters.",
      alertFreeze: "Below-freezing temperatures. Watch for ice.",
      dataProvidedBy: "Data provided by",
      // Error messages
      dataFetchError: "Could not fetch weather data. Please check the city name and try again.",
      cityNotFound: "City not found. Please enter a valid city name.",
      locationBlocked: "Location is blocked. Please allow location access in your browser settings.",
      locationError: "Could not get your location. Please search for a city manually.",
      enterCityNameError: "Please enter a city name", // Message for empty search field
    },
  };

  const LOCALES = {
    ro: 'ro-RO',
    en: 'en-US',
  };

  // Themes are CSS-variable palettes in a single stylesheet, selected via the
  // data-theme attribute on <html>. "auto" follows the OS (prefers-color-scheme).
  const KNOWN_THEMES = ["auto", "dark", "light", "neon", "modern", "playful"];

  export function isKnownTheme(theme) {
    return KNOWN_THEMES.includes(theme);
  }

  export function applyTheme(theme) {
    const safeTheme = isKnownTheme(theme) ? theme : "auto";
    document.documentElement.setAttribute("data-theme", safeTheme);
  }
  
  /**
   * Afișează un mesaj pe interfața utilizatorului.
   * @param {string} messageKey - Cheia de traducere pentru mesaj.
   * @param {string} type - Tipul mesajului (e.g., 'error', 'success').
   * @param {string} lang - Limba curentă pentru traducere.
   */
  function showMessage(messageKey, type = 'error', lang = 'ro') {
    const msgElement = UI_elements.errorMessage;
    const translatedMessage = TRANSLATIONS[lang]?.[messageKey] || messageKey; // Fallback la cheie dacă traducerea nu există
    msgElement.textContent = translatedMessage;
    msgElement.className = `error-message ${type}`; // Folosește clasa error-message ca bază
    msgElement.classList.remove('hidden');

  }
  
  export function showError(messageKey, lang = 'ro') {
    // Asigură-te că showMessage primește limba corectă.
    // În app.js, vei avea acces la currentLanguage, deci o poți trimite aici.
    // Pentru simplitate, momentan o vom prelua direct din localStorage sau implicit.
    const currentLang = storage.getItem('language') || 'ro';
    showMessage(messageKey, 'error', currentLang);
  }
  
  let toastTimer = null;
  /**
   * Afișează o notificare tranzitorie (toast) anunțată de cititoarele de ecran.
   * @param {string} messageKey - Cheie de traducere sau text direct.
   * @param {string} type - 'success' | 'error' | '' (neutru).
   */
  export function showToast(messageKey, type = 'success') {
    const toast = UI_elements.toast;
    if (!toast) return;

    const currentLang = storage.getItem('language') || 'ro';
    const translated = TRANSLATIONS[currentLang]?.[messageKey] || messageKey;

    toast.textContent = translated;
    toast.className = `toast show ${type}`.trim();
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  export function showSuccess(message) {
    showToast(message, 'success');
  }
  
  export function hideError() {
    UI_elements.errorMessage.classList.add("hidden");
  }
  
  export function showLoading() {
    UI_elements.loadingSpinner.classList.remove('hidden');
    document.querySelector('main').setAttribute('aria-busy', 'true');
    hideError();
  }
  export function hideLoading() {
    UI_elements.loadingSpinner.classList.add('hidden');
    document.querySelector('main').setAttribute('aria-busy', 'false');
  }

  /**
   * Actualizează afișajul unității de temperatură.
   * Aceasta va adăuga sau elimina o clasă pentru a indica vizual unitatea activă,
   * fără a schimba textul etichetelor °C și °F.
   * @param {string} unit - 'metric' pentru Celsius, 'imperial' pentru Fahrenheit.
   */
  export function updateTemperatureUnitDisplay(unit) {
    const celsiusLabel = UI_elements.celsiusLabel;
    const fahrenheitLabel = UI_elements.displayUnit; // Acesta este span-ul pentru °F
  
    if (unit === "metric") { // Dacă unitatea curentă este Celsius
      if (celsiusLabel) {
        celsiusLabel.classList.add('active-unit-label');
      }
      if (fahrenheitLabel) {
        fahrenheitLabel.classList.remove('active-unit-label');
      }
    } else { // Dacă unitatea curentă este Imperial (Fahrenheit)
      if (celsiusLabel) {
        celsiusLabel.classList.remove('active-unit-label');
      }
      if (fahrenheitLabel) {
        fahrenheitLabel.classList.add('active-unit-label');
      }
    }
  }
  
  /**
   * Afișează datele meteo pe interfața utilizatorului.
   * @param {Object} weather - Datele meteo curente.
   * @param {Object} forecast - Datele prognozei.
   * @param {string} units - Unitățile curente (metric/imperial).
   */
  function setWeatherAmbient(weather) {
    const body = document.body;
    if (!body) return;
    const main = String(weather?.weather?.[0]?.main || "").toLowerCase();
    const icon = String(weather?.weather?.[0]?.icon || "");
    const conditionMap = {
      clear: "clear",
      clouds: "clouds",
      rain: "rain",
      drizzle: "drizzle",
      thunderstorm: "thunderstorm",
      snow: "snow",
      mist: "mist",
      fog: "fog",
      haze: "mist",
      smoke: "mist",
    };
    body.dataset.condition = conditionMap[main] || "clouds";
    body.dataset.daytime = icon.endsWith("n") ? "night" : "day";
  }

  export function displayWeatherData(weather, forecast, airQuality, units = "metric") {
    // Asigură-te că UI_elements.tempToggle este disponibil și că este un element valid
    UI_elements.forecastSection.classList.add("hidden");
    UI_elements.airQuality.classList.add("hidden");

    setWeatherAmbient(weather);
  
    UI_elements.cityName.textContent = [weather.name, weather.sys?.country].filter(Boolean).join(', ');
    UI_elements.dateTime.textContent = formatDateTime(weather.dt, weather.timezone);
    UI_elements.temperature.textContent = Math.round(weather.main.temp);
    UI_elements.feelsLike.textContent = Math.round(weather.main.feels_like);
    UI_elements.weatherIcon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    // Descrierea vremii vine direct de la API și este deja tradusă dacă ai trimis lang-ul în API call
    UI_elements.description.textContent = weather.weather[0].description;
    UI_elements.humidity.textContent = weather.main.humidity;
    UI_elements.windSpeed.textContent = weather.wind.speed.toFixed(1);
    if (UI_elements.windUnitLabel) {
      UI_elements.windUnitLabel.textContent = units === 'metric' ? ' m/s' : ' mph';
    }
    UI_elements.pressure.textContent = weather.main.pressure;
    displayExtraWeatherData(weather, units);
    UI_elements.sunrise.textContent = formatTime(weather.sys?.sunrise, weather.timezone);
    UI_elements.sunset.textContent = formatTime(weather.sys?.sunset, weather.timezone);
    displaySunMoon(weather);

    // Actualizează vizualizarea intervalului de temperatură
    const minTemp = (forecast?.list || []).reduce((min, item) => Math.min(min, item.main.temp_min), weather.main.temp);
    const maxTemp = (forecast?.list || []).reduce((max, item) => Math.max(max, item.main.temp_max), weather.main.temp);
    const currentTemp = weather.main.temp;
  
    UI_elements.tempMinDisplay.textContent = `${Math.round(minTemp)}°`;
    UI_elements.tempMaxDisplay.textContent = `${Math.round(maxTemp)}°`;
    UI_elements.tempCurrentLabel.textContent = `${Math.round(currentTemp)}°`;
  
    // Calculează poziția indicatorului
    const range = maxTemp - minTemp;
    let positionPercentage = 0;
    if (range > 0) {
        positionPercentage = ((currentTemp - minTemp) / range) * 100;
    } else {
        positionPercentage = 50; // Dacă min și max sunt aceleași, plasează la mijloc
    }
    positionPercentage = Math.max(0, Math.min(100, positionPercentage));
  
    UI_elements.tempIndicator.style.left = `${positionPercentage}%`;
    displayWeatherAlerts(weather, forecast, units);
    displayAirQualityData(airQuality);
    renderForecast(forecast, units, storage.getItem('language') || 'ro', t, weather);
  
    UI_elements.weatherInfo.classList.remove("hidden");

    if (UI_elements.searchTextInput) { // Verifică dacă elementul există înainte de a încerca să-l setezi
        UI_elements.searchTextInput.value = ''; // Golește câmpul de căutare
    }
  }

  function getWindCompass(degrees) {
    if (!Number.isFinite(degrees)) return "N/A";

    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % directions.length;
    return directions[index];
  }

  function displayExtraWeatherData(weather, units) {
    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;
    const visibilityKm = Number.isFinite(weather.visibility)
      ? (weather.visibility / 1000).toFixed(1)
      : "N/A";
    const rain = weather.rain?.["1h"] || 0;
    const snow = weather.snow?.["1h"] || 0;
    const precipitation = rain + snow;

    UI_elements.visibility.textContent = `${visibilityKm} km`;
    UI_elements.cloudCover.textContent = `${weather.clouds?.all ?? 0}%`;
    UI_elements.windDirection.textContent = `${getWindCompass(weather.wind?.deg)} ${Number.isFinite(weather.wind?.deg) ? `(${weather.wind.deg}°)` : ""}`;
    UI_elements.precipitation.textContent = precipitation > 0
      ? `${precipitation.toFixed(1)} mm/h`
      : translations.none;

    if (UI_elements.dewPoint) {
      const dew = computeDewPoint(weather.main?.temp, weather.main?.humidity, units);
      UI_elements.dewPoint.textContent = Number.isFinite(dew) ? `${Math.round(dew)}°` : "N/A";
    }
  }

  /** Dew point via the Magnus-Tetens approximation (works in °C; converts °F). */
  function computeDewPoint(temp, humidity, units) {
    if (!Number.isFinite(temp) || !Number.isFinite(humidity)) return NaN;
    const tempC = units === "imperial" ? ((temp - 32) * 5) / 9 : temp;
    const rh = Math.max(1, Math.min(100, humidity)) / 100;
    const a = 17.625;
    const b = 243.04;
    const alpha = Math.log(rh) + (a * tempC) / (b + tempC);
    const dewC = (b * alpha) / (a - alpha);
    return units === "imperial" ? (dewC * 9) / 5 + 32 : dewC;
  }

  /** Moon phase from the synodic cycle anchored at a known new moon (UTC). */
  function getMoonPhase(date) {
    const synodic = 29.530588853;
    const knownNew = Date.UTC(2000, 0, 6, 18, 14, 0) / 1000;
    const seconds = date.getTime() / 1000;
    let age = ((seconds - knownNew) / 86400) % synodic;
    if (age < 0) age += synodic;
    const frac = age / synodic;
    const illumination = (1 - Math.cos(2 * Math.PI * frac)) / 2;
    const idx = Math.floor(frac * 8 + 0.5) % 8;
    return { idx, illumination, age };
  }

  function displaySunMoon(weather) {
    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;

    if (UI_elements.dayLength) UI_elements.dayLength.textContent = "—";
    if (UI_elements.dayLength && Number.isFinite(weather.sys?.sunrise) && Number.isFinite(weather.sys?.sunset)) {
      const seconds = Math.max(0, weather.sys.sunset - weather.sys.sunrise);
      const totalMinutes = Math.round(seconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      UI_elements.dayLength.textContent = `${hours}h ${minutes}m`;
    }

    if (UI_elements.moonPhase) {
      const moon = getMoonPhase(new Date((weather.dt || Date.now() / 1000) * 1000));
      const names = [
        "moonNew", "moonWaxingCrescent", "moonFirstQuarter", "moonWaxingGibbous",
        "moonFull", "moonWaningGibbous", "moonLastQuarter", "moonWaningCrescent",
      ];
      const emojis = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
      UI_elements.moonPhase.textContent =
        `${emojis[moon.idx]} ${translations[names[moon.idx]]} · ${Math.round(moon.illumination * 100)}%`;
    }
  }

  function getAqiTranslationKey(aqi) {
    return {
      1: "aqiGood",
      2: "aqiFair",
      3: "aqiModerate",
      4: "aqiPoor",
      5: "aqiVeryPoor",
    }[aqi] || "aqiModerate";
  }

  function displayAirQualityData(airQuality) {
    const airQualityItem = airQuality?.list?.[0];
    if (!UI_elements.airQuality || !airQualityItem) return;

    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;
    const aqi = Number(airQualityItem.main?.aqi);
    if (![1, 2, 3, 4, 5].includes(aqi)) return;
    const components = airQualityItem.components || {};

    UI_elements.aqiLabel.textContent = translations[getAqiTranslationKey(aqi)];
    UI_elements.aqiIndicator.style.left = `${Math.max(0, Math.min(100, ((aqi || 1) - 1) * 25))}%`;
    UI_elements.pm25.textContent = Number.isFinite(components.pm2_5) ? `${Math.round(components.pm2_5)} µg/m³` : "—";
    UI_elements.pm10.textContent = Number.isFinite(components.pm10) ? `${Math.round(components.pm10)} µg/m³` : "—";
    UI_elements.o3.textContent = Number.isFinite(components.o3) ? `${Math.round(components.o3)} µg/m³` : "—";
    UI_elements.airQuality.dataset.aqi = String(aqi || 0);
    UI_elements.airQuality.classList.remove("hidden");
  }

  function getForecastWindow(forecast, maxItems = 8) {
    if (!forecast || !Array.isArray(forecast.list)) return [];
    return forecast.list.slice(0, maxItems);
  }

  function displayWeatherAlerts(weather, forecast, units) {
    const alertsContainer = UI_elements.weatherAlerts;
    if (!alertsContainer) return;

    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;
    const forecastWindow = getForecastWindow(forecast, 8);
    const weatherCodes = [
      weather.weather?.[0]?.id,
      ...forecastWindow.map((item) => item.weather?.[0]?.id),
    ].filter(Boolean);
    const windSpeeds = [
      weather.wind?.speed,
      ...forecastWindow.map((item) => item.wind?.speed),
    ].filter((value) => Number.isFinite(value));
    const temperatures = [
      weather.main?.temp,
      ...forecastWindow.map((item) => item.main?.temp),
    ].filter((value) => Number.isFinite(value));

    const alertKeys = [];
    if (weatherCodes.some((code) => code >= 200 && code < 300)) alertKeys.push("alertThunderstorm");
    if (weatherCodes.some((code) => code >= 500 && code < 600)) alertKeys.push("alertHeavyRain");
    if (weatherCodes.some((code) => code >= 600 && code < 700)) alertKeys.push("alertSnow");
    if (windSpeeds.some((speed) => speed >= (units === "metric" ? 11 : 25))) alertKeys.push("alertHighWind");
    if (temperatures.some((temp) => temp >= (units === "metric" ? 32 : 90))) alertKeys.push("alertHeat");
    if (temperatures.some((temp) => temp <= (units === "metric" ? 0 : 32))) alertKeys.push("alertFreeze");

    alertsContainer.replaceChildren();
    if (alertKeys.length === 0) {
      alertsContainer.classList.add("hidden");
      return;
    }

    alertKeys.slice(0, 3).forEach((key) => {
      const alert = document.createElement("p");
      alert.className = "weather-alert";
      alert.textContent = translations[key];
      alertsContainer.appendChild(alert);
    });
    alertsContainer.classList.remove("hidden");
  }

  function createCityTag(city, clickHandler, removeHandler) {
    const listItem = document.createElement("li");
    const label = document.createElement("button");
    const remove = document.createElement("button");
    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;

    label.type = "button";
    label.className = "tag-action";
    label.textContent = typeof city === "string" ? city : city.label || city.name;
    label.addEventListener("click", () => clickHandler(typeof city === "string" ? { city } : city));

    remove.type = "button";
    remove.className = "tag-remove";
    remove.title = translations.removeCity;
    remove.setAttribute("aria-label", `${translations.removeCity}: ${typeof city === "string" ? city : city.label || city.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      removeHandler(city);
    });

    listItem.className = "tag-item";
    listItem.append(label, remove);
    return listItem;
  }

  export function updateRecentSearchesList(searches, clickHandler, removeHandler) {
    const list = UI_elements.recentSearchesList;
    if (!list) return; // Asigură-te că lista există
  
    list.replaceChildren(); // Golește lista existentă fără HTML parsing
  
    if (searches.length === 0) {
      if (UI_elements.recentSearchesSection) {
        UI_elements.recentSearchesSection.classList.add("hidden");
      }
      return;
    } else {
      if (UI_elements.recentSearchesSection) {
        UI_elements.recentSearchesSection.classList.remove("hidden");
      }
    }
  
    searches.forEach((city) => {
      list.appendChild(createCityTag(city, clickHandler, removeHandler));
    });
  }

  export function updateCitySuggestions(suggestions, datalist) {
    if (!datalist) return;

    datalist.replaceChildren();
    suggestions.forEach((suggestion) => {
      const option = document.createElement("option");
      option.value = [
        suggestion.name,
        suggestion.state,
        suggestion.country,
      ].filter(Boolean).join(", ");
      datalist.appendChild(option);
    });
  }

  export function updateFavoriteCitiesList(cities, clickHandler, removeHandler) {
    const list = UI_elements.favoriteSearchesList;
    if (!list) return;

    list.replaceChildren();

    if (cities.length === 0) {
      UI_elements.favoriteSearchesSection.classList.add("hidden");
      return;
    }

    UI_elements.favoriteSearchesSection.classList.remove("hidden");
    cities.forEach((city) => {
      list.appendChild(createCityTag(city, clickHandler, removeHandler));
    });
  }

  export function updateFavoriteButton(cityName, favoriteCities) {
    if (!UI_elements.saveFavoriteButton || !UI_elements.saveFavoriteLabel) return;

    const currentLang = storage.getItem('language') || 'ro';
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.ro;
    const isFavorite = favoriteCities.includes(cityName);

    UI_elements.saveFavoriteButton.classList.toggle("is-active", isFavorite);
    UI_elements.saveFavoriteButton.title = translations[isFavorite ? "removeFavorite" : "saveFavorite"];
    UI_elements.saveFavoriteLabel.textContent = translations[isFavorite ? "removeFavorite" : "saveFavorite"];
  }
  
  /**
   * Aplică traducerile statice elementelor UI pe baza limbii curente.
   * @param {string} lang - Limba curentă (e.g., 'ro', 'en').
   */
  export function applyStaticUITranslations(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ro';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = (TRANSLATIONS[lang] || TRANSLATIONS.ro)[element.dataset.i18n];
      if (text) element.textContent = text;
    });
    const currentTranslations = TRANSLATIONS[lang] || TRANSLATIONS['ro']; // Fallback la română
  
    // Actualizează textul și atributele elementelor UI
    if (UI_elements.getGeolocationButton) {
        UI_elements.getGeolocationButton.textContent = currentTranslations.currentLocation;
    }
    if (UI_elements.getGeolocationButtonTitle) {
        UI_elements.getGeolocationButtonTitle.title = currentTranslations.useCurrentLocation;
    }
    if (UI_elements.searchPlaceholder) {
        UI_elements.searchPlaceholder.placeholder = currentTranslations.enterCityName;
        UI_elements.searchPlaceholder.setAttribute("aria-label", currentTranslations.enterCityName);
    }
    if (UI_elements.loadingLabel) {
        UI_elements.loadingLabel.textContent = currentTranslations.loading;
    }
    if (UI_elements.celsiusLabel) {
        UI_elements.celsiusLabel.textContent = currentTranslations.celsiusSymbol;
    }
    if (UI_elements.displayUnit) {
        UI_elements.displayUnit.textContent = currentTranslations.fahrenheitSymbol;
    }
    if (UI_elements.feelsLikeLabel) {
        UI_elements.feelsLikeLabel.textContent = currentTranslations.feelsLike;
    }
    if (UI_elements.weatherIconAlt) {
        UI_elements.weatherIconAlt.alt = currentTranslations.weatherIconAlt;
    }
    if (UI_elements.humidityLabel) {
        UI_elements.humidityLabel.textContent = currentTranslations.humidity;
    }
    if (UI_elements.windLabel) {
        UI_elements.windLabel.textContent = currentTranslations.wind;
    }
    if (UI_elements.windUnitLabel) {
        UI_elements.windUnitLabel.textContent = currentTranslations.windUnit;
    }
    if (UI_elements.pressureLabel) {
        UI_elements.pressureLabel.textContent = currentTranslations.pressure;
    }
    if (UI_elements.pressureUnitLabel) {
        UI_elements.pressureUnitLabel.textContent = currentTranslations.pressureUnit;
    }
    if (UI_elements.visibilityLabel) {
        UI_elements.visibilityLabel.textContent = currentTranslations.visibility;
    }
    if (UI_elements.cloudCoverLabel) {
        UI_elements.cloudCoverLabel.textContent = currentTranslations.cloudCover;
    }
    if (UI_elements.windDirectionLabel) {
        UI_elements.windDirectionLabel.textContent = currentTranslations.windDirection;
    }
    if (UI_elements.precipitationLabel) {
        UI_elements.precipitationLabel.textContent = currentTranslations.precipitation;
    }
    if (UI_elements.dewPointLabel) {
        UI_elements.dewPointLabel.textContent = currentTranslations.dewPoint;
    }
    if (UI_elements.sunriseLabel) {
        UI_elements.sunriseLabel.textContent = currentTranslations.sunrise;
    }
    if (UI_elements.sunsetLabel) {
        UI_elements.sunsetLabel.textContent = currentTranslations.sunset;
    }
    if (UI_elements.dayLengthLabel) {
        UI_elements.dayLengthLabel.textContent = currentTranslations.dayLength;
    }
    if (UI_elements.moonPhaseLabel) {
        UI_elements.moonPhaseLabel.textContent = currentTranslations.moonPhase;
    }
    if (UI_elements.airQualityLabel) {
        UI_elements.airQualityLabel.textContent = currentTranslations.airQuality;
    }
    if (UI_elements.recentSearchesTitle) {
        UI_elements.recentSearchesTitle.textContent = currentTranslations.recentSearchesTitle;
    }
    if (UI_elements.favoriteSearchesTitle) {
        UI_elements.favoriteSearchesTitle.textContent = currentTranslations.favoriteSearchesTitle;
    }
    if (UI_elements.forecastTitle) {
        UI_elements.forecastTitle.textContent = currentTranslations.forecastTitle;
    }
    if (UI_elements.saveFavoriteButton) {
        UI_elements.saveFavoriteButton.title = currentTranslations.saveFavorite;
    }
    if (UI_elements.saveFavoriteLabel) {
        UI_elements.saveFavoriteLabel.textContent = currentTranslations.saveFavorite;
    }
    if (UI_elements.shareWeatherButton) {
        UI_elements.shareWeatherButton.title = currentTranslations.copyLink;
    }
    if (UI_elements.copyLinkLabel) {
        UI_elements.copyLinkLabel.textContent = currentTranslations.copyLink;
    }
    if (UI_elements.refreshWeatherButton) {
        UI_elements.refreshWeatherButton.title = currentTranslations.refreshWeather;
    }
    if (UI_elements.refreshWeatherLabel) {
        UI_elements.refreshWeatherLabel.textContent = currentTranslations.refreshWeather;
    }
    if (UI_elements.clearFavoritesButton) {
        UI_elements.clearFavoritesButton.textContent = currentTranslations.clearAll;
    }
    if (UI_elements.clearRecentButton) {
        UI_elements.clearRecentButton.textContent = currentTranslations.clearAll;
    }
    if (UI_elements.themeSelect) {
        Array.from(UI_elements.themeSelect.options).forEach((option) => {
            const translationKey = option.dataset.i18n;
            if (translationKey && currentTranslations[translationKey]) {
                option.textContent = currentTranslations[translationKey];
            }
        });
    }
    if (UI_elements.dataProvidedBy) {
        UI_elements.dataProvidedBy.textContent = currentTranslations.dataProvidedBy;
    }
    
    // Re-aplică stilul pentru unitatea activă după traducere
    const tempToggleChecked = UI_elements.tempToggle ? UI_elements.tempToggle.checked : false;
    updateTemperatureUnitDisplay(tempToggleChecked ? "imperial" : "metric");
  }
  
  
  /**
   * Formatează un timestamp Unix într-un șir lizibil de dată și oră.
   * @param {number} timestamp - Timestamp Unix.
   * @param {number} timezoneOffset - Deplasarea fusului orar în secunde față de UTC.
   * @returns {string} Dată și oră formatate.
   */
  function formatDateTime(timestamp, timezoneOffset) {
    if (!Number.isFinite(timestamp)) return "—";
    const date = new Date((timestamp + (timezoneOffset || 0)) * 1000);
    const options = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', // format 24 de ore
    };
    // Folosește UTC pentru a aplica manual deplasarea fusului orar, apoi formatează local
    // Folosește `currentLanguage` pentru localizarea datei/orei
    const currentLang = storage.getItem('language') || 'ro';
    return date.toLocaleString(LOCALES[currentLang] || LOCALES.ro, { timeZone: 'UTC', ...options });
  }
  /**
   * Formatează un timestamp Unix într-un șir lizibil de oră (HH:MM).
   * @param {number} timestamp - Timestamp Unix.
   * @param {number} timezoneOffset - Deplasarea fusului orar în secunde față de UTC.
   * @returns {string} Oră formatată.
   */
  function formatTime(timestamp, timezoneOffset) {
    if (!Number.isFinite(timestamp)) return "—";
    const date = new Date((timestamp + (timezoneOffset || 0)) * 1000);
    const options = {
      hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', // format 24 de ore
    };
    // Folosește UTC pentru a aplica manual deplasarea fusului orar, apoi formatează local
    // Folosește `currentLanguage` pentru localizarea orei
    const currentLang = storage.getItem('language') || 'ro';
    return date.toLocaleString(LOCALES[currentLang] || LOCALES.ro, { timeZone: 'UTC', ...options });
  }

Object.assign(TRANSLATIONS.ro, {
  welcomeTitle: 'Vremea, pe înțelesul tău.', welcomeText: 'Caută un oraș și explorează următoarele zile. Locația ta este folosită doar când o ceri.',
  clearLocalData: 'Șterge datele locale', localDataNote: 'Favoritele și ultima prognoză se păstrează în acest browser.',
  online: 'Conectat', offline: 'Offline', savedData: 'Date salvate', staleData: 'Date mai vechi · furnizor indisponibil', updated: 'Actualizat',
  minutesAgo: 'min în urmă', partialData: 'Unele detalii sunt temporar indisponibile.',
  rateLimited: 'Prea multe cereri. Așteaptă un minut și reîncearcă.', requestTimeout: 'Serviciul meteo răspunde lent. Reîncearcă.',
  serviceUnavailable: 'Serviciul meteo este temporar indisponibil. Reîncearcă în câteva momente.',
  invalidLocation: 'Locația este invalidă. Alege din nou orașul.', offlineSearch: 'Ești offline. Poți vedea ultima locație salvată; pentru o căutare nouă ai nevoie de internet.',
  advisoryNote: 'Indicii calculate din prognoză; nu sunt avertizări meteo oficiale.',
});
Object.assign(TRANSLATIONS.en, {
  welcomeTitle: 'Weather, made clear.', welcomeText: 'Find a city and explore the coming days. Your location is used only when you ask.',
  clearLocalData: 'Clear local data', localDataNote: 'Favorites and the last forecast are stored in this browser.',
  online: 'Online', offline: 'Offline', savedData: 'Saved data', staleData: 'Older data · provider unavailable', updated: 'Updated',
  minutesAgo: 'min ago', partialData: 'Some details are temporarily unavailable.',
  rateLimited: 'Too many requests. Wait a minute and try again.', requestTimeout: 'The weather service is taking too long. Try again.',
  serviceUnavailable: 'Weather is temporarily unavailable. Please try again shortly.',
  invalidLocation: 'Invalid location. Please select the city again.', offlineSearch: 'You are offline. You can view the last saved location; a new search needs internet.',
  advisoryNote: 'Insights calculated from the forecast; these are not official weather warnings.',
});
export function t(key) {
  return (TRANSLATIONS[storage.getItem('language')] || TRANSLATIONS.ro)[key] || key;
}
export function updateConnectionStatus() {
  const element = document.querySelector('#connection-status');
  if (element) { element.textContent = t(navigator.onLine ? 'online' : 'offline'); element.dataset.online = String(navigator.onLine); }
}
export function updateDataStatus(snapshot, { saved = false, offline = false } = {}) {
  const element = document.querySelector('#data-status');
  if (!element) return;
  const weather = snapshot.data.weather;
  const fetchedAt = Number.isFinite(weather._cache?.fetchedAt) ? weather._cache.fetchedAt : snapshot.savedAt;
  const stale = [snapshot.data.weather, snapshot.data.forecast, snapshot.data.airQuality].some(data => data?._cache?.stale);
  const age = Math.max(0, Math.floor((Date.now() - fetchedAt) / 60000));
  element.textContent = `${t(offline || saved ? 'savedData' : stale ? 'staleData' : 'updated')} · ${age} ${t('minutesAgo')} · ${snapshot.units === 'imperial' ? '°F' : '°C'}`;
  element.classList.toggle('is-stale', saved || offline || stale || age > 15);
  element.classList.remove('hidden');
  const partial = document.querySelector('#partial-status');
  const degraded = !snapshot.data.forecast || !snapshot.data.airQuality?.list?.[0];
  partial.textContent = degraded ? t('partialData') : '';
  partial.classList.toggle('hidden', !degraded);
}

Object.assign(TRANSLATIONS.ro, {
  today: 'Astăzi', minimum: 'min.', temperatureMetric: 'Temperatură', rainProbability: 'Risc ploaie', rainAmount: 'Precipitații', maxWind: 'Vânt maxim',
  forecastGuide: 'Alege o zi pentru detalii. Intervale de 3 ore, în ora locală a orașului.',
  forecastSource: 'Prognoză OpenWeather; valorile zilnice folosesc intervalele disponibile.',
  exploreChart: 'Explorează intervalele prognozei', moreDetails: 'Mai multe detalii', summaryTitle: 'Următoarele 24 de ore', temperatureRange: 'Minim / maxim',
  plannerTitle: 'Găsește-ți momentul', plannerText: 'Până la 3 intervale potrivite în următoarele 72 de ore.',
  activity: 'Activitate', walk: 'Plimbare', run: 'Alergare', bike: 'Ciclism', criteria: 'Criterii',
  noActivitySlots: 'Nu există intervale care să îndeplinească aceste criterii în prognoza disponibilă.',
  plannerNote: 'Intervale estimate, nu garanții. Verifică prognoza înainte de plecare. Furtunile și ninsoarea sunt excluse; vântul include rafalele disponibile.',
  navToday: 'Acum', navForecast: 'Prognoză', navPlanner: 'Planificator', skipToContent: 'Sari la conținut',
});
Object.assign(TRANSLATIONS.en, {
  today: 'Today', minimum: 'min.', temperatureMetric: 'Temperature', rainProbability: 'Rain chance', rainAmount: 'Precipitation', maxWind: 'Max wind',
  forecastGuide: 'Choose a day to explore. Three-hour intervals in the city’s local time.',
  forecastSource: 'OpenWeather forecast; daily values use the available intervals.',
  exploreChart: 'Explore forecast intervals', moreDetails: 'More details', summaryTitle: 'The next 24 hours', temperatureRange: 'Low / high',
  plannerTitle: 'Find your moment', plannerText: 'Up to 3 matching slots in the next 72 hours.',
  activity: 'Activity', walk: 'Walk', run: 'Run', bike: 'Cycle', criteria: 'Criteria',
  noActivitySlots: 'No available forecast intervals meet these criteria.',
  plannerNote: 'Estimated intervals, not guarantees. Check the forecast before leaving. Thunderstorms and snow are excluded; wind includes available gusts.',
  navToday: 'Now', navForecast: 'Forecast', navPlanner: 'Planner', skipToContent: 'Skip to content',
});
