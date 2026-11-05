// scripts/config.js
// Acest fișier conține constantele de configurare pentru aplicația meteo.

export const OPENWEATHER_PROXY_BASE_URL = "/api/openweather";
export const DEFAULT_UNIT = "metric"; // Unități de măsură implicite: metric (Celsius) sau imperial (Fahrenheit)
export const MAX_RECENT_SEARCHES = 5; // Numărul maxim de căutări recente de păstrat
export const MAX_FAVORITE_CITIES = 8;

export const STORAGE_KEYS = {
    CHART_METRIC: "chartMetric",
    ACTIVITY: "activityPreference",
    TEMPERATURE_UNIT: "temperatureUnit",
    RECENT_SEARCHES: "recentSearches",
    FAVORITE_CITIES: "favoriteCities",
    THEME: "themePreference",
    LANGUAGE: "language", // Adăugat: Cheie pentru stocarea limbii selectate
    LAST_WEATHER: "lastWeatherSnapshot" // Ultima vreme afișată, pentru offline-first
};

export function weatherIconUrl(code) {
    return /^(?:0[1-4]|09|10|11|13|50)[dn]$/.test(code) ? `/icons/weather/${code}.svg` : '/icons/icon.svg';
}
