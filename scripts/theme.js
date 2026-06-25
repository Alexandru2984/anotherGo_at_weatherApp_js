(function () {
  const assetVersion = "20260625-3";
  const styles = [
    "styles/styles.css",
    "styles/styles_v1.css",
    "styles/styles_v2.css",
    "styles/styles_v3.css",
    "styles/styles_v4.css",
  ];
  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
  const themeLink = document.querySelector("#app-theme");

  if (themeLink) {
    themeLink.href = `${selectedStyle}?v=${assetVersion}`;
  }
})();
