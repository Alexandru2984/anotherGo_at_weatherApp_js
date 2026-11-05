# Operațiuni pentru weather.micutu.com

## Traseu și izolare

Cloudflare (inclusiv Tunnel) → nginx vhost `weather.micutu.com` →
`127.0.0.1:8105` → serviciul `weather-canary.service`.

Repo: `/srv/canary/weather.micutu.com/app`. Versiuni publicate:
`/srv/canary/weather.micutu.com/releases/<commit>`. Symlinkul `current` indică
versiunea pornită de systemd. Cheia rămâne în `app/.env` (0600), citită prin
`EnvironmentFile`; nu se copiază în release. Directorul vechi `www` nu mai este
servit. Testele rulează separat pe 18105, fără cheie sau acces la producție.

Procesul este neprivilegiat, cu systemd `ProtectSystem=strict`, capabilități
eliminate, `NoNewPrivileges`, 256 MiB memorie, 64 taskuri și 1024 descriptori.
Procesul folosește utilizatorul dinamic dedicat `weather-canary`, cu
`DynamicUser=true`, fără grupul Docker și fără acces direct la `app/.env` sau
la socketul Docker. systemd citește EnvironmentFile înainte de schimbarea
identității. UID-ul se poate schimba după restart; aplicația nu scrie stare pe disc.

## Publicare obișnuită

```bash
cd /srv/canary/weather.micutu.com/app
npm ci --ignore-scripts
npm run check
npm test
npm run test:browser
git status --short # verifică ce se va include în commit
# Creează commitul cu identitatea Git a proprietarului, fără coautori automați.
node scripts/release.js HEAD --activate
npm run smoke
SMOKE_BASE_URL=https://weather.micutu.com npm run smoke
```

Scriptul verifică existența tuturor asseturilor în commit, extrage doar lista
runtime și verifică sintaxa serverului. Schimbă atomic symlinkul, repornește
**doar** `weather-canary` și verifică release-ul din `/healthz`. Dacă noul serviciu
nu devine sănătos, revine la symlinkul anterior și încearcă să repornească versiunea
anterioară. Nu șterge release-uri și nu modifică nginx la fiecare publicare.
Nu dezvăluie cheia. Verificarea de sănătate nu înlocuiește verificarea reală API.

Rollback către un release deja verificat:

```bash
node scripts/release.js COMMIT_ANTERIOR --activate
```

Păstrează cel puțin două release-uri verificate. Nu șterge directorul indicat de
`current`. Dacă rollback-ul nu pornește, inspectează `systemctl status` și jurnalul,
restaurează configurația anterioară și verifică separat disponibilitatea API.

## Configurare inițială sau migrare

Exemplele din `deploy/` conțin domeniul real și căile acestui VPS. Verifică-le
înainte de a le folosi pe alt server. `nginx-weather.production.conf` presupune
că zona `weather_api` și restaurarea IP-urilor Cloudflare sunt deja în contextul
nginx global. `TRUST_PROXY` este sigur numai dacă proxy-ul suprascrie `X-Real-IP`
și accesul Node este exclusiv pe loopback.

```bash
node scripts/release.js HEAD
# O singură dată: creează symlinkul current către directorul afișat de script.
# Instalează deploy/weather-app.service.example ca weather-canary.service.
sudo systemctl daemon-reload
sudo systemctl restart weather-canary
# Dacă modifici vhostul, salvează întâi copia anterioară.
sudo nginx -t && sudo systemctl reload nginx
```

Nu schimba nginx global și nu reporni toate serviciile pentru acest proiect.
Copiile inițiale nginx/systemd ale acestei intervenții sunt într-un director
`/tmp/weather-audit-20261105-*` cu permisiuni 0700; sunt temporare. Referința de
revenire durabilă este configurația versionată și release-ul anterior verificat.

## Chei și incidente

Pentru rotire: creează cheia în contul OpenWeather, revocă cheia veche, editează
`app/.env`, păstrează 0600, apoi repornește doar `weather-canary` și rulează smoke.
Nu trimite cheia în chat și nu o publica în comenzi, URL-uri sau Git. Curățarea
istoricului nu revocă o cheie și nu a fost executată în această intervenție.

Monitorizează `/healthz` la 60 s și alertează după trei eșecuri; urmărește 429,
502/504, 503 și consumul din contul OpenWeather. Destinatarul alertelor și un
monitor extern nu sunt configurate automat de repo. Access logul dedicat nu
conține IP sau query. Logurile de eroare nginx/journal trebuie protejate și
rotite conform politicii operatorului.

## SEO și actualizarea asseturilor

La schimbări de frontend, păstrează aceeași valoare `?v=` în HTML, importuri și
worker, apoi crește `CACHE_NAME`. `npm run check` verifică alinierea. Iconițele
SVG se pot reconstrui cu `node scripts/build-weather-icons.js`; imaginea socială
cu `node scripts/create-social-preview.js` (necesită dependențele dev și Chromium).
Actualizează `lastmod` din sitemap la o schimbare reală de conținut. Adaugă
sitemapul în Search Console din contul operatorului; repo-ul nu are acces acolo.

Paginile HTML trimit `Cache-Control: public, max-age=0, must-revalidate,
no-transform`. Cloudflare respectă această directivă pentru injecțiile automate
Web Analytics și JavaScript Detections. Astfel CSP poate rămâne strictă, fără
scripturi inline sau terțe. Acest lucru nu modifică setările globale Cloudflare;
semnalul JavaScript Detections poate lipsi pentru paginile acestui domeniu. Codul
și cache-ul API au în continuare protecțiile proprii. Comprimarea trebuie făcută
la origine dacă este dorită pentru HTML, deoarece Cloudflare nu transformă corpul.
Referințe: [Cloudflare cache directives](https://developers.cloudflare.com/cache/concepts/cache-control/),
[Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/faq/).
