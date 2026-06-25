// scripts/ui.js
// Acest modul gestionează actualizarea interfeței utilizatorului și traducerile.

const UI_elements = {
    loadingSpinner: document.querySelector("#loading-spinner"),
    errorMessage: document.querySelector("#error-message"),
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
    sunrise: document.querySelector("#sunrise"),
    sunset: document.querySelector("#sunset"),
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
    temperatureChart: document.querySelector("#temperature-chart"),
    weatherAlerts: document.querySelector("#weather-alerts"),
    saveFavoriteButton: document.querySelector("#save-favorite"),
    shareWeatherButton: document.querySelector("#share-weather"),
    refreshWeatherButton: document.querySelector("#refresh-weather"),
    celsiusLabel: document.querySelector(".unit-toggle > span:first-child"),

    // Elemente pentru traduceri statice
    getGeolocationButton: document.querySelector("#get-location span"),
    getGeolocationButtonTitle: document.querySelector("#get-location"), // Pentru atributul title
    searchPlaceholder: document.querySelector(".search-container .input"), // Pentru placeholder
    feelsLikeLabel: document.querySelector(".feels-like span:first-child"),
    humidityLabel: document.querySelector(".weather-details [data-i18n='humidity']"),
    windLabel: document.querySelector(".weather-details [data-i18n='wind']"),
    windUnitLabel: document.querySelector(".weather-details [data-i18n='windUnit']"),
    pressureLabel: document.querySelector(".weather-details [data-i18n='pressure']"),
    pressureUnitLabel: document.querySelector(".weather-details [data-i18n='pressureUnit']"),
    sunriseLabel: document.querySelector(".sun-times [data-i18n='sunrise']"),
    sunsetLabel: document.querySelector(".sun-times [data-i18n='sunset']"),
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
      sunrise: "Răsărit",
      sunset: "Apus",
      forecastTitle: "Prognoză pe 5 zile",
      recentSearchesTitle: "Căutări Recente",
      favoriteSearchesTitle: "Favorite",
      saveFavorite: "Favorite",
      removeFavorite: "Favorit salvat",
      copyLink: "Copiază link",
      refreshWeather: "Actualizează",
      linkCopied: "Linkul a fost copiat.",
      linkCopyError: "Nu am putut copia linkul.",
      alertThunderstorm: "Risc de furtună în prognoza apropiată.",
      alertHeavyRain: "Ploaie semnificativă în următoarele ore.",
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
      sunrise: "Sunrise",
      sunset: "Sunset",
      forecastTitle: "5-day forecast",
      recentSearchesTitle: "Recent Searches",
      favoriteSearchesTitle: "Favorites",
      saveFavorite: "Favorite",
      removeFavorite: "Saved favorite",
      copyLink: "Copy link",
      refreshWeather: "Refresh",
      linkCopied: "Link copied.",
      linkCopyError: "Could not copy the link.",
      alertThunderstorm: "Thunderstorm risk in the nearby forecast.",
      alertHeavyRain: "Significant rain in the next hours.",
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
    setTimeout(() => {
      msgElement.classList.add('hidden');
    }, 5000); // Ascunde după 5 secunde
  }
  
  export function showError(messageKey, lang = 'ro') {
    // Asigură-te că showMessage primește limba corectă.
    // În app.js, vei avea acces la currentLanguage, deci o poți trimite aici.
    // Pentru simplitate, momentan o vom prelua direct din localStorage sau implicit.
    const currentLang = localStorage.getItem('language') || 'ro';
    showMessage(messageKey, 'error', currentLang);
  }
  
  export function showSuccess(message, lang = 'ro') {
    // Pentru mesaje de succes care nu sunt neapărat din TRANSLATIONS, poți folosi direct stringul.
    // Dacă vrei să le traduci, va trebui să adaugi chei în TRANSLATIONS.
    const currentLang = localStorage.getItem('language') || lang;
    showMessage(message, 'success', currentLang);
  }
  
  export function hideError() {
    UI_elements.errorMessage.classList.add("hidden");
  }
  
  export function showLoading() {
    UI_elements.loadingSpinner.classList.remove("hidden");
    UI_elements.weatherInfo.classList.add("hidden");
    UI_elements.recentSearchesSection.classList.add("hidden");
    UI_elements.favoriteSearchesSection.classList.add("hidden");
    UI_elements.forecastSection.classList.add("hidden");
    UI_elements.weatherAlerts.classList.add("hidden");
    hideError();
  }
  
  export function hideLoading() {
    UI_elements.loadingSpinner.classList.add("hidden");
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
  export function displayWeatherData(weather, forecast) {
    // Asigură-te că UI_elements.tempToggle este disponibil și că este un element valid
    const units = UI_elements.tempToggle && UI_elements.tempToggle.checked ? "imperial" : "metric";
  
    UI_elements.cityName.textContent = weather.name + ', ' + weather.sys.country;
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
    UI_elements.sunrise.textContent = formatTime(weather.sys.sunrise, weather.timezone);
    UI_elements.sunset.textContent = formatTime(weather.sys.sunset, weather.timezone);
  
    // Actualizează vizualizarea intervalului de temperatură
    const minTemp = forecast.list.reduce((min, item) => Math.min(min, item.main.temp_min), Infinity);
    const maxTemp = forecast.list.reduce((max, item) => Math.max(max, item.main.temp_max), -Infinity);
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
    displayTemperatureChart(forecast, units);
    displayForecastCards(forecast, units);
  
    UI_elements.weatherInfo.classList.remove("hidden");
    UI_elements.recentSearchesSection.classList.remove("hidden");
    UI_elements.favoriteSearchesSection.classList.remove("hidden");
    if (UI_elements.searchTextInput) { // Verifică dacă elementul există înainte de a încerca să-l setezi
        UI_elements.searchTextInput.value = ''; // Golește câmpul de căutare
    }
  }

  function getForecastWindow(forecast, maxItems = 8) {
    if (!forecast || !Array.isArray(forecast.list)) return [];
    return forecast.list.slice(0, maxItems);
  }

  function displayWeatherAlerts(weather, forecast, units) {
    const alertsContainer = UI_elements.weatherAlerts;
    if (!alertsContainer) return;

    const currentLang = localStorage.getItem('language') || 'ro';
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

  function displayTemperatureChart(forecast, units) {
    const canvas = UI_elements.temperatureChart;
    if (!canvas || !forecast || !Array.isArray(forecast.list)) return;

    const points = forecast.list.slice(0, 8).map((item) => ({
      temp: item.main.temp,
      label: formatTime(item.dt, forecast.city?.timezone || 0),
    }));

    if (points.length < 2) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 28;
    const minTemp = Math.min(...points.map((point) => point.temp));
    const maxTemp = Math.max(...points.map((point) => point.temp));
    const tempRange = Math.max(1, maxTemp - minTemp);

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(128, 128, 128, 0.25)";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary-color").trim() || "#64b5f6";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = padding + ((maxTemp - point.temp) / tempRange) * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    points.forEach((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = padding + ((maxTemp - point.temp) / tempRange) * (height - padding * 2);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`${Math.round(point.temp)}°`, x, Math.max(14, y - 8));
      if (index % 2 === 0) {
        ctx.fillText(point.label, x, height - 8);
      }
    });

    canvas.setAttribute("aria-label", `${points.map((point) => `${point.label}: ${Math.round(point.temp)}°`).join(", ")} ${units === "metric" ? "Celsius" : "Fahrenheit"}`);
  }

  function getDailyForecastItems(forecast) {
    if (!forecast || !Array.isArray(forecast.list)) return [];

    const dailyItems = new Map();
    forecast.list.forEach((item) => {
      const dateKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
      const hour = new Date(item.dt * 1000).getUTCHours();
      const existingItem = dailyItems.get(dateKey);

      if (!existingItem || Math.abs(hour - 12) < Math.abs(existingItem.hour - 12)) {
        dailyItems.set(dateKey, {
          hour,
          item,
        });
      }
    });

    return Array.from(dailyItems.values()).slice(0, 5).map(({ item }) => item);
  }

  function displayForecastCards(forecast, units) {
    const forecastList = UI_elements.forecastList;
    if (!forecastList) return;

    forecastList.replaceChildren();
    const dailyItems = getDailyForecastItems(forecast);

    if (dailyItems.length === 0) {
      UI_elements.forecastSection.classList.add("hidden");
      return;
    }

    const currentLang = localStorage.getItem('language') || 'ro';
    dailyItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "forecast-card";

      const date = document.createElement("span");
      date.className = "forecast-day";
      date.textContent = new Date(item.dt * 1000).toLocaleDateString(
        LOCALES[currentLang] || LOCALES.ro,
        { weekday: "short", day: "2-digit", month: "short" }
      );

      const icon = document.createElement("img");
      icon.className = "forecast-icon";
      icon.src = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
      icon.alt = item.weather[0].description;
      icon.loading = "lazy";

      const temp = document.createElement("strong");
      temp.className = "forecast-temp";
      temp.textContent = `${Math.round(item.main.temp)}°`;

      const meta = document.createElement("span");
      meta.className = "forecast-meta";
      meta.textContent = `${Math.round(item.main.humidity)}% · ${item.wind.speed.toFixed(1)}${units === "metric" ? " m/s" : " mph"}`;

      card.append(date, icon, temp, meta);
      forecastList.appendChild(card);
    });

    UI_elements.forecastSection.classList.remove("hidden");
  }
  
  /**
   * Actualizează lista de căutări recente.
   * @param {Array<string>} searches - Tablou cu numele orașelor căutate recent.
   * @param {Function} clickHandler - Funcția de apelat când se face clic pe o etichetă de căutare recentă.
   */
  export function updateRecentSearchesList(searches, clickHandler) {
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
      const listItem = document.createElement("li");
      listItem.textContent = city;
      listItem.addEventListener("click", () => clickHandler({ city }));
      list.appendChild(listItem);
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

  export function updateFavoriteCitiesList(cities, clickHandler) {
    const list = UI_elements.favoriteSearchesList;
    if (!list) return;

    list.replaceChildren();

    if (cities.length === 0) {
      UI_elements.favoriteSearchesSection.classList.add("hidden");
      return;
    }

    UI_elements.favoriteSearchesSection.classList.remove("hidden");
    cities.forEach((city) => {
      const listItem = document.createElement("li");
      listItem.textContent = city;
      listItem.addEventListener("click", () => clickHandler({ city }));
      list.appendChild(listItem);
    });
  }

  export function updateFavoriteButton(cityName, favoriteCities) {
    if (!UI_elements.saveFavoriteButton || !UI_elements.saveFavoriteLabel) return;

    const currentLang = localStorage.getItem('language') || 'ro';
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
    if (UI_elements.sunriseLabel) {
        UI_elements.sunriseLabel.textContent = currentTranslations.sunrise;
    }
    if (UI_elements.sunsetLabel) {
        UI_elements.sunsetLabel.textContent = currentTranslations.sunset;
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
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', // format 24 de ore
    };
    // Folosește UTC pentru a aplica manual deplasarea fusului orar, apoi formatează local
    // Folosește `currentLanguage` pentru localizarea datei/orei
    const currentLang = localStorage.getItem('language') || 'ro';
    return date.toLocaleString(LOCALES[currentLang] || LOCALES.ro, { timeZone: 'UTC', ...options });
  }
  /**
   * Formatează un timestamp Unix într-un șir lizibil de oră (HH:MM).
   * @param {number} timestamp - Timestamp Unix.
   * @param {number} timezoneOffset - Deplasarea fusului orar în secunde față de UTC.
   * @returns {string} Oră formatată.
   */
  function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = {
      hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', // format 24 de ore
    };
    // Folosește UTC pentru a aplica manual deplasarea fusului orar, apoi formatează local
    // Folosește `currentLanguage` pentru localizarea orei
    const currentLang = localStorage.getItem('language') || 'ro';
    return date.toLocaleString(LOCALES[currentLang] || LOCALES.ro, { timeZone: 'UTC', ...options });
  }
