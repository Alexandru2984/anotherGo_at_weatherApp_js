(function () {
  const assetVersion = "20260626-4";
  const themeStorageKey = "themePreference";
  const themes = {
    auto: [
      "styles/styles.css",
      "styles/styles_v1.css",
      "styles/styles_v2.css",
      "styles/styles_v3.css",
      "styles/styles_v4.css",
    ],
    dark: "styles/styles.css",
    light: "styles/styles_v1.css",
    neon: "styles/styles_v2.css",
    modern: "styles/styles_v3.css",
    playful: "styles/styles_v4.css",
  };
  let savedTheme = "auto";
  try {
    savedTheme = localStorage.getItem(themeStorageKey) || "auto";
  } catch {
    savedTheme = "auto";
  }
  const themeValue = themes[savedTheme] ? savedTheme : "auto";
  const themeSource = themes[themeValue];
  const selectedStyle = Array.isArray(themeSource)
    ? themeSource[Math.floor(Math.random() * themeSource.length)]
    : themeSource;
  const themeLink = document.querySelector("#app-theme");

  if (themeLink) {
    themeLink.href = `${selectedStyle}?v=${assetVersion}`;
  }
})();
