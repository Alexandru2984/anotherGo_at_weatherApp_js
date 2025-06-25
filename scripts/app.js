// scripts/app.js
// Fișierul principal al aplicației meteo, coordonează modulele și gestionează starea.
// Acest fișier gestionează inițializarea, ascultătorii de evenimente și fluxul aplicației.

import {
  DEFAULT_UNIT,
  MAX_RECENT_SEARCHES,
  STORAGE_KEYS
} from './config.js'; // Importă constante direct din config.js (în același folder scripts/)

import * as ui from './ui.js';     // Importă întregul modul ui ca obiect
import * as utils from './utils.js'; // Importă întregul modul utils ca obiect
import * as api from './api.js';     // Importă întregul modul api ca obiect


// Starea aplicației
let units = DEFAULT_UNIT;
let recentSearches = [];
let currentLanguage = 'ro'; // Adaugă o variabilă pentru limba curentă


// Cache-ul elementelor DOM
const elements = {
  searchForm: document.querySelector("#search-form"),
  getLocationButton: document.querySelector("#get-location"),
  tempToggle: document.querySelector("#temp-toggle"),
  langSelect: document.querySelector("#lang-select"), // Adaugă referința pentru selectorul de limbă
};

// Inițializează aplicația
initTemperatureUnit();
initRecentSearchesList();
initLanguage(); // Noua funcție de inițializare a limbii
displayInitialWeather();
setupEventListeners();


// Declarații de funcții

/**
 * Funcție utilitară pentru a prelua un parametru din URL.
 * @param {string} name - Numele parametrului.
 * @returns {string} Valoarea parametrului sau un șir gol dacă nu există.
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
  const storedSearches = localStorage.getItem(
    STORAGE_KEYS.RECENT_SEARCHES
  );
  recentSearches = storedSearches ? JSON.parse(storedSearches) : [];
  ui.updateRecentSearchesList(recentSearches, displayWeather);
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
  const urlCity = getUrlParameter('city');
  if (urlCity) {
    console.log(`Using city from URL parameter: ${urlCity}`);
    displayWeather({ city: urlCity });
    return;
  }

  // 1. Try to use recent searches if available
  if (recentSearches.length > 0) {
    const city = recentSearches[0];
    console.log(`Using most recent search: ${city}`);
    displayWeather({ city });
    return;
  }

  console.log("No recent searches or URL parameter found, trying geolocation...");

  // 2. Try browser geolocation
  try {
    const { lat, lon } = await utils.getUserLocation();
    console.log(`Geolocation successful: ${lat}, ${lon}`);
    displayWeather({ lat, lon });
    return;
  } catch (error) {
    console.log("Geolocation failed, trying IP-based location...");
  }

  // 3. Try IP-based geolocation as fallback
  try {
    const { lat, lon } = await api.fetchLocationByIP();
    console.log(`IP location successful: ${lat}, ${lon}`);
    displayWeather({ lat, lon });
    return;
  } catch (error) {
    console.log("IP-based location failed, no weather data shown");
  }

  // 4. If all methods fail, we just show the empty interface
  console.log("All location methods failed. Showing empty interface.");
}

function addToRecentSearches(cityName) {
  // Check if city is already in recent searches
  const index = recentSearches.indexOf(cityName);
  if (index !== -1) {
    // Remove it from current position
    recentSearches.splice(index, 1);
  }

  // Add to beginning of array
  recentSearches.unshift(cityName);

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
    addToRecentSearches(data.weather.name);
  } catch (error) {
    let errorMessageKey = "dataFetchError"; // Cheia implicită de eroare
    if (error.message.includes("City not found")) {
      errorMessageKey = "cityNotFound";
    } else if (error.message.includes("HTTP error!")) {
      errorMessageKey = "dataFetchError"; // Sau o cheie mai specifică dacă ai
    } else if (error.message.includes("Locația este blocată")) {
      errorMessageKey = "locationBlocked";
    }
    ui.showError(errorMessageKey); // Trimite cheia de traducere
    console.error("Error fetching weather data:", error);
  } finally {
    ui.hideLoading();
  }
}

function setupEventListeners() {
  elements.searchForm.addEventListener("submit", handleWeatherSearch);
  elements.getLocationButton.addEventListener("click", handleLocationRequest);
  elements.tempToggle.addEventListener("change", handleUnitChange);
  if (elements.langSelect) { // Adaugă listener pentru selectorul de limbă
    elements.langSelect.addEventListener("change", handleLanguageChange);
  }
}

function handleWeatherSearch(event) {
  event.preventDefault();
  const city = new FormData(event.target).get("city");

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
    console.error("Geolocation request error:", error);
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
  displayInitialWeather(); // Re-fetch weather data (dacă API-ul OpenWeatherMap suportă limba, altfel doar reîmprospătează UI-ul)
}
