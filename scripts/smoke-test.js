const baseUrl = new URL(process.env.SMOKE_BASE_URL || "http://127.0.0.1:8105");

const checks = [
  { path: "/", name: "home" },
  { path: "/healthz", name: "health" },
  { path: "/manifest.webmanifest", name: "manifest" },
  { path: "/sw-v4.js", name: "service worker loader" },
  { path: "/api/openweather/geo/direct?q=Bucuresti&limit=1", name: "geocoding" },
  { path: "/api/openweather/weather?lat=44.4268&lon=26.1025&units=metric&lang=ro", name: "weather" },
  { path: "/api/openweather/forecast?lat=44.4268&lon=26.1025&units=metric&lang=ro", name: "forecast" },
  { path: "/api/openweather/air_pollution?lat=44.4268&lon=26.1025", name: "air quality" },
];

async function runCheck({ path, name }) {
  const url = new URL(path, baseUrl);
  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: {
      Accept: path.startsWith("/api/") || path === "/healthz"
        ? "application/json"
        : "*/*",
    },
  });
  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    throw new Error(`${name} failed with HTTP ${response.status}`);
  }

  if (path.startsWith("/api/") || path === "/healthz") {
    await response.json();
  } else {
    await response.text();
  }

  console.log(`${name}: ${response.status} ${durationMs}ms`);
}

for (const check of checks) {
  await runCheck(check);
}
