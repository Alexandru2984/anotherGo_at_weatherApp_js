// scripts/app.js
// Fișierul principal al aplicației meteo, coordonează modulele și gestionează starea.
// Acest fișier gestionează inițializarea, ascultătorii de evenimente și fluxul aplicației.

import {
  DEFAULT_UNIT,
  MAX_FAVORITE_CITIES,
  MAX_RECENT_SEARCHES,
  STORAGE_KEYS
} from './config.js'; // Importă constante direct din config.js (în același folder scripts/)

import * as ui from './ui.js';     // Importă întregul modul ui ca obiect
import * as utils from './utils.js'; // Importă întregul modul utils ca obiect
import * as api from './api.js';     // Importă întregul modul api ca obiect


// Starea aplicației
let units = DEFAULT_UNIT;
let recentSearches = [];
let favoriteCities = [];
let currentLanguage = 'ro'; // Adaugă o variabilă pentru limba curentă
let currentCityName = "";


// Cache-ul elementelor DOM
const elements = {
  searchForm: document.querySelector("#search-form"),
  getLocationButton: document.querySelector("#get-location"),
  tempToggle: document.querySelector("#temp-toggle"),
  langSelect: document.querySelector("#lang-select"), // Adaugă referința pentru selectorul de limbă
  saveFavoriteButton: document.querySelector("#save-favorite"),
  shareWeatherButton: document.querySelector("#share-weather"),
};

// Inițializează aplicația
initTemperatureUnit();
initRecentSearchesList();
initFavoriteCitiesList();
initLanguage(); // Noua funcție de inițializare a limbii
displayInitialWeather();
setupEventListeners();
registerServiceWorker();


// Declarații de funcții

/**
 * Funcție utilitară pentru a prelua un parametru din URL.
 * @param {string} name - Numele parametrului.
 * @returns {string} Valoarea parametrului sau un șir gol dacă nu există.
 */
function getUrlParameter(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function normalizeCityInput(city) {
  return String(city || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function readJsonArrayFromStorage(key) {
  try {
    const storedValue = localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item) => typeof item === "string")
      : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

/**
 * Initialize the temperature unit from localStorage
 */
function initTemperatureUnit() {
  const storedUnit = localStorage.getItem(STORAGE_KEYS.TEMPERATURE_UNIT);
  units = storedUnit || DEFAULT_UNIT;
  elements.tempToggle.checked = units === "imperial";
  ui.updateTemperatureUnitDisplay(units);
}

/**
 * Initialize the recent searches list from localStorage
 */
function initRecentSearchesList() {
  recentSearches = readJsonArrayFromStorage(STORAGE_KEYS.RECENT_SEARCHES)
    .slice(0, MAX_RECENT_SEARCHES);
  ui.updateRecentSearchesList(recentSearches, displayWeather);
}

/**
 * Initialize the favorite city list from localStorage
 */
function initFavoriteCitiesList() {
  favoriteCities = readJsonArrayFromStorage(STORAGE_KEYS.FAVORITE_CITIES)
    .slice(0, MAX_FAVORITE_CITIES);
  ui.updateFavoriteCitiesList(favoriteCities, displayWeather);
}

/**
 * Initialize the language from localStorage or default.
 * Also applies static UI translations based on the selected language.
 */
function initLanguage() {
  const storedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  currentLanguage = storedLang || 'ro'; // Setează limba implicită la română

  // Setează valoarea selectorului de limbă dacă există
  if (elements.langSelect) {
    elements.langSelect.value = currentLanguage;
  }
  
  // Aplică traducerile statice UI
  ui.applyStaticUITranslations(currentLanguage); 
}

/**
 * Get initial weather data using a fallback strategy:
 * 0. Try 'city' query parameter from URL
 * 1. Try recent searches first
 * 2. Try browser geolocation API
 * 3. Try IP-based geolocation
 * 4. Silently fail if all methods fail
 */
async function displayInitialWeather() {
  // 0. Try 'city' query parameter from URL
  const urlCity = normalizeCityInput(getUrlParameter('city'));
  if (urlCity) {
    displayWeather({ city: urlCity });
    return;
  }

  // 1. Try to use recent searches if available
  if (recentSearches.length > 0) {
    const city = recentSearches[0];
    displayWeather({ city });
    return;
  }

  // 2. Try browser geolocation
  try {
    const { lat, lon } = await utils.getUserLocation();
    displayWeather({ lat, lon });
    return;
  } catch (error) {
    ui.showError(
      error.message.includes("Locația este blocată") ? "locationBlocked" : "locationError"
    );
  }
}

function addToRecentSearches(cityName) {
  const safeCityName = normalizeCityInput(cityName);
  if (!safeCityName) return;

  // Check if city is already in recent searches
  const index = recentSearches.indexOf(safeCityName);
  if (index !== -1) {
    // Remove it from current position
    recentSearches.splice(index, 1);
  }

  // Add to beginning of array
  recentSearches.unshift(safeCityName);

  // Keep only the most recent searches
  if (recentSearches.length > MAX_RECENT_SEARCHES) {
    recentSearches.pop();
  }

  // Save to localStorage
  localStorage.setItem(
    STORAGE_KEYS.RECENT_SEARCHES,
    JSON.stringify(recentSearches)
  );

  // Update the UI
  ui.updateRecentSearchesList(recentSearches, displayWeather);
}

function saveFavoriteCities() {
  localStorage.setItem(
    STORAGE_KEYS.FAVORITE_CITIES,
    JSON.stringify(favoriteCities)
  );
  ui.updateFavoriteCitiesList(favoriteCities, displayWeather);
  ui.updateFavoriteButton(currentCityName, favoriteCities);
}

function toggleCurrentFavorite() {
  if (!currentCityName) return;

  const index = favoriteCities.indexOf(currentCityName);
  if (index !== -1) {
    favoriteCities.splice(index, 1);
  } else {
    favoriteCities.unshift(currentCityName);
    favoriteCities = favoriteCities.slice(0, MAX_FAVORITE_CITIES);
  }

  saveFavoriteCities();
}

async function shareCurrentWeather() {
  if (!currentCityName) return;

  const shareUrl = new URL(window.location.href);
  shareUrl.search = "";
  shareUrl.searchParams.set("city", currentCityName);

  try {
    await navigator.clipboard.writeText(shareUrl.toString());
    ui.showSuccess("linkCopied");
  } catch {
    ui.showError("linkCopyError");
  }
}

async function displayWeather({ city, lat, lon }) {
  try {
    ui.showLoading();
    ui.hideError();

    // Fetch weather and forecast data by city name or coordinates
    const data = await api.fetchWeatherAndForecast({
      city,
      lat,
      lon,
      units,
      lang: currentLanguage // Trimite limba către API dacă API-ul o suportă
    });

    ui.displayWeatherData(data.weather, data.forecast);
    currentCityName = normalizeCityInput(data.weather.name);
    ui.updateFavoriteButton(currentCityName, favoriteCities);
    addToRecentSearches(data.weather.name);
  } catch (error) {
    let errorMessageKey = "dataFetchError"; // Cheia implicită de eroare
    if (error.message.includes("Orașul nu a fost găsit") || error.message.includes("City not found")) {
      errorMessageKey = "cityNotFound";
    } else if (error.message.includes("HTTP error!") || error.message.includes("Eroare HTTP!")) {
      errorMessageKey = "dataFetchError"; // Sau o cheie mai specifică dacă ai
    } else if (error.message.includes("Locația este blocată")) {
      errorMessageKey = "locationBlocked";
    }
    ui.showError(errorMessageKey); // Trimite cheia de traducere
  } finally {
    ui.hideLoading();
  }
}

function setupEventListeners() {
  elements.searchForm.addEventListener("submit", handleWeatherSearch);
  elements.getLocationButton.addEventListener("click", handleLocationRequest);
  elements.tempToggle.addEventListener("change", handleUnitChange);
  elements.saveFavoriteButton.addEventListener("click", toggleCurrentFavorite);
  elements.shareWeatherButton.addEventListener("click", shareCurrentWeather);
  if (elements.langSelect) { // Adaugă listener pentru selectorul de limbă
    elements.langSelect.addEventListener("change", handleLanguageChange);
  }
}

function handleWeatherSearch(event) {
  event.preventDefault();
  const city = normalizeCityInput(new FormData(event.target).get("city"));

  if (!city) {
    ui.showError("enterCityNameError"); // Trimite cheia de traducere corectă
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
  displayInitialWeather(); // Re-fetch weather with new units
}

/**
 * Handles language change event.
 * Updates the current language, saves it to localStorage,
 * applies static UI translations, and refreshes initial weather display.
 * @param {Event} event - The change event from the language select element.
 */
function handleLanguageChange(event) {
  currentLanguage = event.target.value;
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, currentLanguage);
  ui.applyStaticUITranslations(currentLanguage); // Aplică traducerile statice
  ui.updateFavoriteButton(currentCityName, favoriteCities);
  displayInitialWeather(); // Re-fetch weather data (dacă API-ul OpenWeatherMap suportă limba, altfel doar reîmprospătează UI-ul)
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Aplicația rămâne funcțională fără PWA/offline cache.
    });
  });
}
