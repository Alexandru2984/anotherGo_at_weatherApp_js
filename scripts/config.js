// scripts/config.js
// Acest fișier conține constantele de configurare pentru aplicația meteo.

export const OPENWEATHER_API_KEY = ""; // Folosește doar pentru rulare statică locală. În producție folosește proxy-ul.
export const OPENWEATHER_PROXY_BASE_URL = "/api/openweather";
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
export const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0";
export const DEFAULT_UNIT = "metric"; // Unități de măsură implicite: metric (Celsius) sau imperial (Fahrenheit)
export const MAX_RECENT_SEARCHES = 5; // Numărul maxim de căutări recente de păstrat

export const STORAGE_KEYS = {
    TEMPERATURE_UNIT: "temperatureUnit",
    RECENT_SEARCHES: "recentSearches",
    LANGUAGE: "language" // Adăugat: Cheie pentru stocarea limbii selectate
};
