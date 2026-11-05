# Vremea

Aplicație meteo în JavaScript, HTML și CSS, cu server Node.js 24. Serverul nu are
pachete runtime externe. Cheia OpenWeather este folosită exclusiv de proxy-ul
same-origin `/api/openweather`.

- Vreme curentă, AQI, răsărit/apus, umiditate, vizibilitate și punct de rouă.
- Prognoză pentru următoarele 5 zile în intervale de 3 ore; carduri zilnice cu
  min/max și precipitații, calculate în fusul furnizat de OpenWeather.
- Zile selectabile, grafic temperatură/ploaie/vânt și cursor accesibil din tastatură.
- Rezumat pentru intervalele disponibile din următoarele 24 h și planificator
  pentru plimbare, alergare și ciclism în următoarele 72 h.
- Căutare cu sugestii, geolocalizare la cerere, favorite cu coordonate și partajare.
- RO/EN, °C/°F, șase opțiuni de temă și layout adaptat pentru mobil/desktop.
- PWA cu shell finit în cache, iconițe/font local și ultimul snapshot pentru offline.
  API-ul și locațiile nu sunt salvate în Cache Storage. Snapshotul rămâne în
  localStorage cel mult 24 h pentru afișare; butonul din footer îl poate șterge.

## Rulare locală

```bash
node --version # 24 sau mai nou
cp .env.example .env
# Editează OPENWEATHER_API_KEY în .env, fără a publica valoarea.
chmod 600 .env
npm start
```

Cu `.env.example`, aplicația rulează la `http://127.0.0.1:8105`. Fără `.env`,
portul implicit al serverului este 3050. `npm start` încarcă explicit `.env`.
Fără cheie funcționează interfața, iar API-ul răspunde 503. Nu introduce cheia în
frontend, URL-uri, documente sau commituri.

Pentru testele de dezvoltare:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm test
npm run test:browser
```

Testele HTTP și browser folosesc date simulate, fără cheie reală și fără apeluri
OpenWeather. Playwright pornește un server separat pe `127.0.0.1:18105` și nu
reutilizează serviciul live. Testele desktop și mobil rulează pe Chromium;
Safari/iOS și Firefox reale nu sunt acoperite de această suită.

Verificarea cu furnizorul real este separată și consumă cotă API:

```bash
npm run smoke
SMOKE_BASE_URL=https://weather.micutu.com npm run smoke
```

## Securitate și date

Fișierele publice sunt într-o allowlist explicită; documentele, `.env`, Git,
testele, scripturile de operare și linkurile simbolice nu sunt servite. Proxy-ul
acceptă doar endpointuri/parametri validați, are timeouturi, corp upstream limitat
la 512 KiB, maximum 8 cereri upstream simultane și buget implicit de 50 apeluri
upstream/minut. Cache-ul comun este limitat la 500 intrări și 16 MiB de conținut;
limitele per IP se aplică și răspunsurilor din cache.

`TRUST_PROXY=true` este destinat exclusiv nginx pe loopback, care suprascrie
`X-Real-IP` după procesarea IP-ului Cloudflare. Browserul nu trimite cereri direct
furnizorului: inclusiv fontul și iconițele sunt locale. Logurile aplicației nu
includ IP-uri sau query-uri; nginx are un format de access log dedicat fără IP,
query, referrer sau user agent. Logurile de eroare ale infrastructurii pot
conține detalii de diagnostic și trebuie protejate separat.

Orașul/coordonatele se trimit către OpenWeather prin server. Cloudflare și VPS-ul
procesează conexiunile vizitatorilor; furnizorul meteo vede IP-ul VPS-ului.
Favoritele, preferințele și ultimul snapshot rămân în browser, fără cont.

**Risc rămas:** cheia activă a fost expusă în istoricul Git. Valoarea a fost
eliminată din README și din fișierele publice. Rotirea a fost amânată explicit de
proprietar la 2026-11-05; limitarea proxy-ului nu protejează cheia folosită direct
în afara aplicației. Nu s-a rescris istoricul și nu s-a făcut force-push.

## Publicare și documentație

[Operațiuni și rollback](docs/OPERATIONS.md), [auditul complet](docs/AUDIT.md),
[planul de produs](docs/ROADMAP.md). Configurațiile domeniului sunt în `deploy/`.
Publicarea folosește doar fișierele runtime dintr-un commit, într-un director de
release separat; modificările necomise nu ajung în versiunea publicată.

CI verifică sintaxa, consistența asseturilor și versiunii workerului, testează
proxy-ul, fluxurile desktop/mobil și accesibilitatea. Nu publică automat pe VPS.
SEO include canonical, metadate sociale, robots și sitemap; linkurile cu locații
au header `X-Robots-Tag: noindex, follow`. Nu există promisiuni de indexare sau
clasare, pagini individuale de orașe ori date meteo randate pe server pentru SEO.

Planificatorul folosește praguri explicite pentru temperatură, ploaie și vânt,
include rafalele disponibile și exclude furtunile/ninsoarea. El oferă estimări,
fără a înlocui avertizările oficiale. API-ul actual nu furnizează radar, UV,
polen sau prognoze de 14 zile. Decalajul orar numeric nu descrie schimbări viitoare
de oră de vară; faza lunii și punctul de rouă sunt aproximări.

Font Awesome Free 6.4.0 este distribuit conform [licenței sale](fonts/LICENSE.txt).
Codul proiectului păstrează istoricul și autorii existenți.
