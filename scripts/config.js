// scripts/config.js
// Acest fișier conține constantele de configurare pentru aplicația meteo.

export const OPENWEATHER_API_KEY = "6b2c5016bd4466b4560d915499569169"; // ÎNLOCUIEȘTE CU CHEIA TA API!
export const IP_API_KEY = "YOUR_IP_API_KEY"; // Opțional, dacă folosești un serviciu IP cu cheie
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
export const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0";
export const IP_API_BASE_URL = "https://ipapi.co/json/";
export const DEFAULT_UNIT = "metric"; // Unități de măsură implicite: metric (Celsius) sau imperial (Fahrenheit)
export const MAX_RECENT_SEARCHES = 5; // Numărul maxim de căutări recente de păstrat

export const STORAGE_KEYS = {
    TEMPERATURE_UNIT: "temperatureUnit",
    RECENT_SEARCHES: "recentSearches",
    LANGUAGE: "language" // Adăugat: Cheie pentru stocarea limbii selectate
};
