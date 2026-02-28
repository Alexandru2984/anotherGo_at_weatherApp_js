// scripts/ui.js
// Acest modul gestionează actualizarea interfeței utilizatorului și traducerile.

import { STORAGE_KEYS } from './config.js';

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
    windUnitLabel: document.querySelector("#wind-unit-label"),
    pressure: document.querySelector("#pressure"),
    visibility: document.querySelector("#visibility"),
    sunrise: document.querySelector("#sunrise"),
    sunset: document.querySelector("#sunset"),
    tempToggle: document.querySelector("#temp-toggle"),
    displayUnit: document.querySelector("#display-unit"),
    recentSearchesList: document.querySelector("#recent-list"),
    tempRange: document.querySelector("#temp-range"),
    tempMinDisplay: document.querySelector("#temp-min"),
    tempMaxDisplay: document.querySelector("#temp-max"),
    tempIndicator: document.querySelector("#temp-indicator"),
    tempCurrentLabel: document.querySelector("#temp-current-label"),
    searchTextInput: document.querySelector("#city-input"),
    recentSearchesSection: document.querySelector("#recent-searches"),
    celsiusLabel: document.querySelector(".unit-toggle > span:first-child"),
    weatherAnimation: document.querySelector("#weather-animation"),

    // Forecast
    forecastSection: document.querySelector("#forecast-section"),
    dailyForecast: document.querySelector("#daily-forecast"),
    hourlyForecast: document.querySelector("#hourly-forecast"),
    forecastTabs: document.querySelectorAll(".forecast-tab"),

    // Autocomplete
    autocompleteDropdown: document.querySelector("#autocomplete-dropdown"),

    // Share
    shareBtn: document.querySelector("#share-btn"),

    // Clear searches
    clearSearchesBtn: document.querySelector("#clear-searches"),

    // Elemente pentru traduceri statice
    getGeolocationButton: document.querySelector("#get-location span"),
    getGeolocationButtonTitle: document.querySelector("#get-location"),
    searchPlaceholder: document.querySelector("#city-input"),
    feelsLikeLabel: document.querySelector(".feels-like span:first-child"),
    humidityLabel: document.querySelector(".weather-details [data-i18n='humidity']"),
    windLabel: document.querySelector(".weather-details [data-i18n='wind']"),
    pressureLabel: document.querySelector(".weather-details [data-i18n='pressure']"),
    pressureUnitLabel: document.querySelector(".weather-details [data-i18n='pressureUnit']"),
    visibilityLabel: document.querySelector("[data-i18n='visibility']"),
    visibilityUnitLabel: document.querySelector("[data-i18n='visibilityUnit']"),
    sunriseLabel: document.querySelector(".sun-times [data-i18n='sunrise']"),
    sunsetLabel: document.querySelector(".sun-times [data-i18n='sunset']"),
    recentSearchesTitle: document.querySelector("#recent-searches h3"),
    dataProvidedBy: document.querySelector(".app-footer [data-i18n='dataProvidedBy']"),
    weatherIconAlt: document.querySelector("#weather-icon"),
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
        windUnitImperial: " mph",
        pressure: "Presiune",
        pressureUnit: " hPa",
        visibility: "Vizibilitate",
        visibilityUnit: " km",
        sunrise: "Răsărit",
        sunset: "Apus",
        recentSearchesTitle: "Căutări Recente",
        dataProvidedBy: "Date furnizate de",
        share: "Distribuie",
        daily: "5 Zile",
        hourly: "Orar",
        shareSuccess: "Link copiat în clipboard!",
        shareNotSupported: "Link-ul a fost copiat:",
        // Mesaje de eroare
        dataFetchError: "Nu am putut obține datele meteo. Verificați numele orașului și încercați din nou.",
        cityNotFound: "Orașul nu a fost găsit. Vă rugăm să introduceți un nume de oraș valid.",
        locationBlocked: "Locația este blocată. Vă rugăm să permiteți accesul la locație în setările browserului.",
        locationError: "Nu am putut obține locația dvs. Vă rugăm să căutați manual un oraș.",
        enterCityNameError: "Vă rugăm să introduceți numele unui oraș",
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
        windUnitImperial: " mph",
        pressure: "Pressure",
        pressureUnit: " hPa",
        visibility: "Visibility",
        visibilityUnit: " km",
        sunrise: "Sunrise",
        sunset: "Sunset",
        recentSearchesTitle: "Recent Searches",
        dataProvidedBy: "Data provided by",
        share: "Share",
        daily: "5 Days",
        hourly: "Hourly",
        shareSuccess: "Link copied to clipboard!",
        shareNotSupported: "Link copied:",
        // Error messages
        dataFetchError: "Could not fetch weather data. Please check the city name and try again.",
        cityNotFound: "City not found. Please enter a valid city name.",
        locationBlocked: "Location is blocked. Please allow location access in your browser settings.",
        locationError: "Could not get your location. Please search for a city manually.",
        enterCityNameError: "Please enter a city name",
    },
};

// Mapare condiții meteo → animații CSS
const WEATHER_ANIMATION_MAP = {
    Thunderstorm: 'anim-thunderstorm',
    Drizzle: 'anim-rain',
    Rain: 'anim-rain',
    Snow: 'anim-snow',
    Atmosphere: 'anim-fog',
    Clear: 'anim-sunny',
    Clouds: 'anim-cloudy',
};

function getCurrentLang() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'ro';
}

function t(key) {
    const lang = getCurrentLang();
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['ro'][key] || key;
}

function showMessage(messageKey, type = 'error') {
    const msgElement = UI_elements.errorMessage;
    const translated = t(messageKey);
    msgElement.textContent = translated;
    msgElement.className = `error-message ${type}`;
    msgElement.classList.remove('hidden');
    setTimeout(() => msgElement.classList.add('hidden'), 5000);
}

export function showError(messageKey) {
    showMessage(messageKey, 'error');
}

export function showSuccess(messageKey) {
    showMessage(messageKey, 'success');
}

export function hideError() {
    UI_elements.errorMessage.classList.add("hidden");
}

export function showLoading() {
    UI_elements.loadingSpinner.classList.remove("hidden");
    UI_elements.weatherInfo.classList.add("hidden");
    UI_elements.recentSearchesSection.classList.add("hidden");
    if (UI_elements.forecastSection) {
        UI_elements.forecastSection.classList.add("hidden");
    }
    hideError();
}

export function hideLoading() {
    UI_elements.loadingSpinner.classList.add("hidden");
}

export function updateTemperatureUnitDisplay(unit) {
    const celsiusLabel = UI_elements.celsiusLabel;
    const fahrenheitLabel = UI_elements.displayUnit;

    if (unit === "metric") {
        celsiusLabel?.classList.add('active-unit-label');
        fahrenheitLabel?.classList.remove('active-unit-label');
    } else {
        celsiusLabel?.classList.remove('active-unit-label');
        fahrenheitLabel?.classList.add('active-unit-label');
    }
}

/**
 * Aplică animație meteo pe baza codului de condiție.
 * @param {number} weatherCode - Codul condiției meteo (OpenWeatherMap).
 */
function setWeatherAnimation(weatherCode) {
    const animEl = UI_elements.weatherAnimation;
    if (!animEl) return;

    // Elimină clasele anterioare
    animEl.className = 'weather-animation';
    animEl.innerHTML = '';

    let category = 'Clear';
    if (weatherCode >= 200 && weatherCode < 300) category = 'Thunderstorm';
    else if (weatherCode >= 300 && weatherCode < 400) category = 'Drizzle';
    else if (weatherCode >= 500 && weatherCode < 600) category = 'Rain';
    else if (weatherCode >= 600 && weatherCode < 700) category = 'Snow';
    else if (weatherCode >= 700 && weatherCode < 800) category = 'Atmosphere';
    else if (weatherCode === 800) category = 'Clear';
    else if (weatherCode > 800) category = 'Clouds';

    const animClass = WEATHER_ANIMATION_MAP[category];
    if (animClass) animEl.classList.add(animClass);

    // Generează particule pentru ploaie/zăpadă
    if (category === 'Rain' || category === 'Drizzle' || category === 'Thunderstorm') {
        for (let i = 0; i < 20; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            animEl.appendChild(drop);
        }
    } else if (category === 'Snow') {
        for (let i = 0; i < 20; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.animationDelay = `${Math.random() * 3}s`;
            flake.style.animationDuration = `${2 + Math.random() * 2}s`;
            flake.style.width = flake.style.height = `${4 + Math.random() * 6}px`;
            animEl.appendChild(flake);
        }
    } else if (category === 'Clear') {
        const sun = document.createElement('div');
        sun.className = 'sun-rays';
        animEl.appendChild(sun);
    } else if (category === 'Clouds') {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-particle';
            cloud.style.top = `${10 + i * 15}%`;
            cloud.style.animationDelay = `${i * 2}s`;
            animEl.appendChild(cloud);
        }
    }
}

/**
 * Grupează datele prognozei pe zile.
 */
function groupForecastByDay(forecastList) {
    const days = {};
    forecastList.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; // "2024-01-15"
        if (!days[date]) days[date] = [];
        days[date].push(item);
    });
    return days;
}

/**
 * Afișează prognoza zilnică pe 5 zile.
 */
export function displayDailyForecast(forecast) {
    const container = UI_elements.dailyForecast;
    if (!container) return;
    container.innerHTML = '';

    const days = groupForecastByDay(forecast.list);
    const today = new Date().toISOString().split('T')[0];
    const lang = getCurrentLang();
    const locale = lang === 'ro' ? 'ro-RO' : 'en-US';

    Object.entries(days).slice(0, 6).forEach(([dateStr, items]) => {
        if (dateStr === today) return; // Sări ziua curentă (o avem deja în weather-info)

        const minTemp = Math.round(Math.min(...items.map(i => i.main.temp_min)));
        const maxTemp = Math.round(Math.max(...items.map(i => i.main.temp_max)));

        // Alege intrarea de la prânz (12:00) sau prima disponibilă
        const noonItem = items.find(i => i.dt_txt.includes('12:00:00')) || items[0];
        const icon = noonItem.weather[0].icon;
        const description = noonItem.weather[0].description;

        const date = new Date(dateStr + 'T12:00:00Z');
        const dayName = date.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
        const dayNum = date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

        const card = document.createElement('div');
        card.className = 'forecast-day';
        card.innerHTML = `
            <div class="forecast-day-name">${dayName}</div>
            <div class="forecast-day-date">${dayNum}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" title="${description}" />
            <div class="forecast-temps">
                <span class="forecast-max">${maxTemp}°</span>
                <span class="forecast-min">${minTemp}°</span>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Afișează prognoza orară pentru următoarele 24 de ore.
 */
export function displayHourlyForecast(forecast) {
    const container = UI_elements.hourlyForecast;
    if (!container) return;
    container.innerHTML = '';

    const lang = getCurrentLang();
    const locale = lang === 'ro' ? 'ro-RO' : 'en-US';

    forecast.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString(locale, {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        const description = item.weather[0].description;

        const card = document.createElement('div');
        card.className = 'forecast-hour';
        card.innerHTML = `
            <div class="forecast-hour-time">${time}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" title="${description}" />
            <div class="forecast-hour-temp">${temp}°</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Afișează datele meteo pe interfața utilizatorului.
 */
export function displayWeatherData(weather, forecast) {
    const units = UI_elements.tempToggle?.checked ? "imperial" : "metric";

    UI_elements.cityName.textContent = weather.name + ', ' + weather.sys.country;
    UI_elements.dateTime.textContent = formatDateTime(weather.dt, weather.timezone);
    UI_elements.temperature.textContent = Math.round(weather.main.temp);
    UI_elements.feelsLike.textContent = Math.round(weather.main.feels_like);
    UI_elements.weatherIcon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    UI_elements.description.textContent = weather.weather[0].description;
    UI_elements.humidity.textContent = weather.main.humidity;
    UI_elements.pressure.textContent = weather.main.pressure;
    UI_elements.sunrise.textContent = formatTime(weather.sys.sunrise, weather.timezone);
    UI_elements.sunset.textContent = formatTime(weather.sys.sunset, weather.timezone);

    // Viteza vântului + unitate corectă
    const windSpeed = units === 'metric'
        ? weather.wind.speed.toFixed(1)
        : (weather.wind.speed * 2.237).toFixed(1);
    UI_elements.windSpeed.textContent = windSpeed;
    if (UI_elements.windUnitLabel) {
        UI_elements.windUnitLabel.textContent = units === 'metric' ? t('windUnit') : t('windUnitImperial');
    }

    // Vizibilitate (API returnează în metri, afișăm în km)
    if (UI_elements.visibility) {
        const visKm = weather.visibility != null
            ? (weather.visibility / 1000).toFixed(1)
            : '—';
        UI_elements.visibility.textContent = visKm;
    }

    // Bara de temperatură (folosind prognoza pentru min/max global)
    const minTemp = forecast.list.reduce((min, item) => Math.min(min, item.main.temp_min), Infinity);
    const maxTemp = forecast.list.reduce((max, item) => Math.max(max, item.main.temp_max), -Infinity);
    const currentTemp = weather.main.temp;

    UI_elements.tempMinDisplay.textContent = `${Math.round(minTemp)}°`;
    UI_elements.tempMaxDisplay.textContent = `${Math.round(maxTemp)}°`;
    UI_elements.tempCurrentLabel.textContent = `${Math.round(currentTemp)}°`;

    const range = maxTemp - minTemp;
    let positionPercentage = range > 0 ? ((currentTemp - minTemp) / range) * 100 : 50;
    positionPercentage = Math.max(0, Math.min(100, positionPercentage));
    UI_elements.tempIndicator.style.left = `${positionPercentage}%`;

    // Animație meteo
    setWeatherAnimation(weather.weather[0].id);

    // Prognoza
    displayDailyForecast(forecast);
    displayHourlyForecast(forecast);
    if (UI_elements.forecastSection) {
        UI_elements.forecastSection.classList.remove("hidden");
    }

    UI_elements.weatherInfo.classList.remove("hidden");
    UI_elements.recentSearchesSection.classList.remove("hidden");
    if (UI_elements.searchTextInput) {
        UI_elements.searchTextInput.value = '';
    }
}

/**
 * Actualizează lista de căutări recente.
 */
export function updateRecentSearchesList(searches, clickHandler, clearHandler) {
    const list = UI_elements.recentSearchesList;
    if (!list) return;

    list.innerHTML = '';

    if (searches.length === 0) {
        UI_elements.recentSearchesSection?.classList.add("hidden");
        return;
    }

    UI_elements.recentSearchesSection?.classList.remove("hidden");

    searches.forEach((city) => {
        const listItem = document.createElement("li");
        listItem.textContent = city;
        listItem.addEventListener("click", () => clickHandler({ city }));
        list.appendChild(listItem);
    });
}

/**
 * Afișează sugestiile de autocomplete.
 */
export function showAutocompleteSuggestions(suggestions, selectCallback) {
    const dropdown = UI_elements.autocompleteDropdown;
    if (!dropdown) return;

    dropdown.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    suggestions.forEach(item => {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.setAttribute('role', 'option');

        const name = [item.name, item.state, item.country].filter(Boolean).join(', ');
        li.textContent = name;
        li.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Evită pierderea focusului din input
            selectCallback(item.name);
        });
        dropdown.appendChild(li);
    });

    dropdown.classList.remove('hidden');
}

export function hideAutocomplete() {
    UI_elements.autocompleteDropdown?.classList.add('hidden');
}

/**
 * Aplică traducerile statice elementelor UI.
 */
export function applyStaticUITranslations(lang) {
    const tr = TRANSLATIONS[lang] || TRANSLATIONS['ro'];

    UI_elements.getGeolocationButton && (UI_elements.getGeolocationButton.textContent = tr.currentLocation);
    UI_elements.getGeolocationButtonTitle && (UI_elements.getGeolocationButtonTitle.title = tr.useCurrentLocation);
    UI_elements.searchPlaceholder && (UI_elements.searchPlaceholder.placeholder = tr.enterCityName);
    UI_elements.celsiusLabel && (UI_elements.celsiusLabel.textContent = tr.celsiusSymbol);
    UI_elements.displayUnit && (UI_elements.displayUnit.textContent = tr.fahrenheitSymbol);
    UI_elements.feelsLikeLabel && (UI_elements.feelsLikeLabel.textContent = tr.feelsLike);
    UI_elements.weatherIconAlt && (UI_elements.weatherIconAlt.alt = tr.weatherIconAlt);
    UI_elements.humidityLabel && (UI_elements.humidityLabel.textContent = tr.humidity);
    UI_elements.windLabel && (UI_elements.windLabel.textContent = tr.wind);
    UI_elements.pressureLabel && (UI_elements.pressureLabel.textContent = tr.pressure);
    UI_elements.pressureUnitLabel && (UI_elements.pressureUnitLabel.textContent = tr.pressureUnit);
    UI_elements.visibilityLabel && (UI_elements.visibilityLabel.textContent = tr.visibility);
    UI_elements.visibilityUnitLabel && (UI_elements.visibilityUnitLabel.textContent = tr.visibilityUnit);
    UI_elements.sunriseLabel && (UI_elements.sunriseLabel.textContent = tr.sunrise);
    UI_elements.sunsetLabel && (UI_elements.sunsetLabel.textContent = tr.sunset);
    UI_elements.recentSearchesTitle && (UI_elements.recentSearchesTitle.textContent = tr.recentSearchesTitle);
    UI_elements.dataProvidedBy && (UI_elements.dataProvidedBy.textContent = tr.dataProvidedBy);

    // Buton share
    const shareSpan = UI_elements.shareBtn?.querySelector('span');
    if (shareSpan) shareSpan.textContent = tr.share;

    // Tab-uri prognoză
    document.querySelectorAll('.forecast-tab[data-tab="daily"] span').forEach(el => {
        el.textContent = tr.daily;
    });
    document.querySelectorAll('.forecast-tab[data-tab="hourly"] span').forEach(el => {
        el.textContent = tr.hourly;
    });

    // Actualizează și unitatea vântului dacă weather info e vizibilă
    if (UI_elements.windUnitLabel) {
        const units = UI_elements.tempToggle?.checked ? 'imperial' : 'metric';
        UI_elements.windUnitLabel.textContent = units === 'metric' ? tr.windUnit : tr.windUnitImperial;
    }

    const tempToggleChecked = UI_elements.tempToggle ? UI_elements.tempToggle.checked : false;
    updateTemperatureUnitDisplay(tempToggleChecked ? "imperial" : "metric");
}

const LOCALE_MAP = { ro: 'ro-RO', en: 'en-US' };

function formatDateTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hourCycle: 'h23',
    };
    const locale = LOCALE_MAP[getCurrentLang()] || 'ro-RO';
    return date.toLocaleString(locale, { timeZone: 'UTC', ...options });
}

function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    const locale = LOCALE_MAP[getCurrentLang()] || 'ro-RO';
    return date.toLocaleString(locale, { timeZone: 'UTC', ...options });
}
