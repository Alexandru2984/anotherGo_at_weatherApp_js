// Runs before paint: apply the saved theme as a data attribute on <html> so the
// correct CSS-variable palette is active immediately (no flash, no extra fetch).
(function () {
  var KNOWN = ["auto", "dark", "light", "neon", "modern", "playful"];
  var theme = "auto";
  try {
    var saved = localStorage.getItem("themePreference");
    if (saved && KNOWN.indexOf(saved) !== -1) {
      theme = saved;
    }
  } catch (e) {
    theme = "auto";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
