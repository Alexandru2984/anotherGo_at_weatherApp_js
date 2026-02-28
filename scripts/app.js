// scripts/app.js
// Fișierul principal al aplicației meteo, coordonează modulele și gestionează starea.

import {
  DEFAULT_UNIT,
  MAX_RECENT_SEARCHES,
  STORAGE_KEYS
} from './config.js';

import * as ui from './ui.js';
import * as utils from './utils.js';
import * as api from './api.js';

// Starea aplicației
let units = DEFAULT_UNIT;
let recentSearches = [];
let currentLanguage = 'ro';
let lastWeatherCity = null; // Ultimul oraș căutat (pentru share)

// Cache-ul elementelor DOM
const elements = {
  searchForm: document.querySelector("#search-form"),
  getLocationButton: document.querySelector("#get-location"),
  tempToggle: document.querySelector("#temp-toggle"),
  langSelect: document.querySelector("#lang-select"),
  shareBtn: document.querySelector("#share-btn"),
  clearSearchesBtn: document.querySelector("#clear-searches"),
  cityInput: document.querySelector("#city-input"),
  forecastTabs: document.querySelectorAll(".forecast-tab"),
};

// Inițializare
initTemperatureUnit();
initRecentSearchesList();
initLanguage();
displayInitialWeather();
setupEventListeners();

// ── Funcții de inițializare ──────────────────────────────────────────────────

function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function initTemperatureUnit() {
  const storedUnit = localStorage.getItem(STORAGE_KEYS.TEMPERATURE_UNIT);
  units = storedUnit || DEFAULT_UNIT;
  elements.tempToggle.checked = units === "imperial";
  ui.updateTemperatureUnitDisplay(units);
}

function initRecentSearchesList() {
  const storedSearches = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
  recentSearches = storedSearches ? JSON.parse(storedSearches) : [];
  ui.updateRecentSearchesList(recentSearches, displayWeather, clearRecentSearches);
}

function initLanguage() {
  const storedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  currentLanguage = storedLang || 'ro';
  if (elements.langSelect) {
    elements.langSelect.value = currentLanguage;
  }
  ui.applyStaticUITranslations(currentLanguage);
}

async function displayInitialWeather() {
  const urlCity = getUrlParameter('city');
  if (urlCity) {
    displayWeather({ city: urlCity });
    return;
  }

  if (recentSearches.length > 0) {
    displayWeather({ city: recentSearches[0] });
    return;
  }

  try {
    const { lat, lon } = await utils.getUserLocation();
    displayWeather({ lat, lon });
    return;
  } catch (_) { /* continuă */ }

  try {
    const { lat, lon } = await api.fetchLocationByIP();
    displayWeather({ lat, lon });
  } catch (_) { /* interfața goală */ }
}

// ── Logica principală ────────────────────────────────────────────────────────

function addToRecentSearches(cityName) {
  const index = recentSearches.indexOf(cityName);
  if (index !== -1) recentSearches.splice(index, 1);
  recentSearches.unshift(cityName);
  if (recentSearches.length > MAX_RECENT_SEARCHES) recentSearches.pop();
  localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recentSearches));
  ui.updateRecentSearchesList(recentSearches, displayWeather, clearRecentSearches);
}

function clearRecentSearches() {
  recentSearches = [];
  localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  ui.updateRecentSearchesList([], displayWeather, clearRecentSearches);
}

async function displayWeather({ city, lat, lon }) {
  try {
    ui.showLoading();
    ui.hideError();
    ui.hideAutocomplete();

    const data = await api.fetchWeatherAndForecast({
      city, lat, lon, units, lang: currentLanguage
    });

    ui.displayWeatherData(data.weather, data.forecast);
    lastWeatherCity = data.weather.name;
    addToRecentSearches(data.weather.name);

    // Actualizează URL-ul pentru share fără a reîncărca pagina
    const newUrl = `${location.pathname}?city=${encodeURIComponent(data.weather.name)}`;
    history.replaceState(null, '', newUrl);
  } catch (error) {
    let errorMessageKey = "dataFetchError";
    if (error.message.includes("City not found") || error.message.includes("Orașul nu a fost găsit")) {
      errorMessageKey = "cityNotFound";
    } else if (error.message.includes("Locația este blocată")) {
      errorMessageKey = "locationBlocked";
    }
    ui.showError(errorMessageKey);
    console.error("Error fetching weather data:", error);
  } finally {
    ui.hideLoading();
  }
}

// ── Event Listeners ──────────────────────────────────────────────────────────

function setupEventListeners() {
  elements.searchForm.addEventListener("submit", handleWeatherSearch);
  elements.getLocationButton.addEventListener("click", handleLocationRequest);
  elements.tempToggle.addEventListener("change", handleUnitChange);
  elements.langSelect?.addEventListener("change", handleLanguageChange);
  elements.shareBtn?.addEventListener("click", handleShare);
  elements.clearSearchesBtn?.addEventListener("click", clearRecentSearches);

  // Autocomplete
  elements.cityInput?.addEventListener("input", debounce(handleAutocompleteInput, 300));
  elements.cityInput?.addEventListener("blur", () => {
    // Mică întârziere pentru a permite click pe un item din dropdown
    setTimeout(() => ui.hideAutocomplete(), 150);
  });
  elements.cityInput?.addEventListener("keydown", handleAutocompleteKeydown);

  // Tab-uri prognoză
  elements.forecastTabs.forEach(tab => {
    tab.addEventListener("click", handleForecastTabSwitch);
  });
}

function handleWeatherSearch(event) {
  event.preventDefault();
  const city = new FormData(event.target).get("city")?.trim();
  if (!city) {
    ui.showError("enterCityNameError");
    return;
  }
  displayWeather({ city });
}

async function handleLocationRequest() {
  try {
    const { lat, lon } = await utils.getUserLocation();
    displayWeather({ lat, lon });
  } catch (error) {
    ui.showError(
      error.message.includes("Locația este blocată") ? "locationBlocked" : "locationError"
    );
  }
}

function handleUnitChange() {
  units = elements.tempToggle.checked ? "imperial" : "metric";
  localStorage.setItem(STORAGE_KEYS.TEMPERATURE_UNIT, units);
  ui.updateTemperatureUnitDisplay(units);
  displayInitialWeather();
}

function handleLanguageChange(event) {
  currentLanguage = event.target.value;
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, currentLanguage);
  ui.applyStaticUITranslations(currentLanguage);
  displayInitialWeather();
}

async function handleShare() {
  const url = location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: `Vremea în ${lastWeatherCity}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      ui.showSuccess("shareSuccess");
    }
  } catch {
    // Fallback dacă clipboard API nu e disponibil
    ui.showError("shareNotSupported");
  }
}

// ── Autocomplete ─────────────────────────────────────────────────────────────

async function handleAutocompleteInput() {
  const query = elements.cityInput?.value?.trim();
  if (!query || query.length < 2) {
    ui.hideAutocomplete();
    return;
  }
  const suggestions = await api.fetchCitySuggestions(query);
  ui.showAutocompleteSuggestions(suggestions, (cityName) => {
    if (elements.cityInput) elements.cityInput.value = cityName;
    ui.hideAutocomplete();
    displayWeather({ city: cityName });
  });
}

let activeAutocompleteIndex = -1;
function handleAutocompleteKeydown(e) {
  const dropdown = document.querySelector("#autocomplete-dropdown");
  if (!dropdown || dropdown.classList.contains('hidden')) return;

  const items = dropdown.querySelectorAll('.autocomplete-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeAutocompleteIndex = Math.min(activeAutocompleteIndex + 1, items.length - 1);
    items.forEach((item, i) => item.classList.toggle('active', i === activeAutocompleteIndex));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeAutocompleteIndex = Math.max(activeAutocompleteIndex - 1, 0);
    items.forEach((item, i) => item.classList.toggle('active', i === activeAutocompleteIndex));
  } else if (e.key === 'Enter' && activeAutocompleteIndex >= 0) {
    e.preventDefault();
    items[activeAutocompleteIndex]?.click();
    activeAutocompleteIndex = -1;
  } else if (e.key === 'Escape') {
    ui.hideAutocomplete();
    activeAutocompleteIndex = -1;
  }
}

// ── Tab-uri prognoză ─────────────────────────────────────────────────────────

function handleForecastTabSwitch(e) {
  const tab = e.currentTarget.dataset.tab;

  document.querySelectorAll('.forecast-tab').forEach(t => t.classList.remove('active'));
  e.currentTarget.classList.add('active');

  const daily = document.querySelector("#daily-forecast");
  const hourly = document.querySelector("#hourly-forecast");

  if (tab === 'daily') {
    daily?.classList.remove('hidden');
    hourly?.classList.add('hidden');
  } else {
    daily?.classList.add('hidden');
    hourly?.classList.remove('hidden');
  }
}

// ── Utilitare ────────────────────────────────────────────────────────────────

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
