# Audit tehnic și de securitate — 5 noiembrie 2026

## Domeniu și dovezi

Revizuire manuală a întregului server Node, modulelor browser, workerului,
testelor și configurației nginx/systemd pentru acest domeniu. Verificări HTTP
locale și prin nginx, fără scanare agresivă și fără modificarea altor servicii.
Starea inițială: `fd23b6f`, 11 teste unitare trecute. Nu este o certificare de
securitate și nu dovedește absența altor vulnerabilități.

## Constatări inițiale

| Prioritate | Problemă și impact | Acțiune |
| --- | --- | --- |
| Critică | Cheia activă OpenWeather coincide cu cheia publicată în istoric; README conținea aceeași valoare și era servit public de nginx și Node. | Valoare eliminată din documente; accesul la fișiere interne blocat. Rotirea rămâne amânată explicit de proprietar la 2026-11-05. |
| Ridicată | Static server bazat pe denylist: documente, fișiere viitoare și linkuri simbolice puteau expune date interne. | Allowlist explicită și verificarea căii reale. |
| Ridicată | Proxy fără plafon global pentru cereri upstream simultane sau pe minut; limitele per IP puteau fi eludate prin headere nevalidate. | IP acceptat numai de la proxy loopback, validare IP, plafoane globale, răspuns 429/503 și Retry-After. |
| Medie | `Number(null)` / `Number('')` acceptă coordonate lipsă ca 0; parametri necunoscuți/duplicați tolerați. | Validare strictă înainte de apel upstream. |
| Medie | Corp upstream nelimitat și mesaje upstream retransmise integral. | Limită de corp, JSON validat, erori publice generice, redirecturi refuzate. |
| Medie | `add_header Cache-Control` din locațiile nginx pentru JS/CSS/SW elimină moștenirea headerelor de securitate. | Un singur traseu de servire prin Node; nginx păstrează headerele fără override-uri de locație. |
| Medie | IP-uri în logul Node și query-uri cu coordonate în access log nginx. | Loguri fără locație, query și IP în aplicație; format nginx dedicat fără query/IP. |
| Medie | AQI opțional bloca tot ecranul; cererile concurente puteau afișa orașe/unități greșite. | Secvențiere/anulare cereri, degradare parțială. |
| Medie | Snapshot offline insuficient validat; restaurare posibilă pentru alt oraș sau alte unități; date vechi nemarcate. | Validare, potrivire cu cererea și etichetare persistentă a datelor salvate. |
| Medie | Worker salva dinamic orice resursă same-origin și ștergea cache-urile altor aplicații. | Cache finit al shellului, fără API/health, ștergere numai pentru prefixul propriu. |
| Produs | Pagina inițială aproape goală, solicitare automată de locație, lipsă H1, forecast zilnic în fusul browserului și carduri fără interacțiune. | Onboarding explicit, structură responsive, zile interactive și agregare în fusul orașului. |
| Mentenanță | README conține instrucțiuni/structuri învechite; `npm start` nu încarcă `.env`; identitate Git neconfigurată; exemple de deploy divergente de producție. | Documentație actualizată, Node LTS și încărcare explicită env; commituri cu identitatea umană din istoricul existent. |

## Model de amenințări (STRIDE)

1. **Information disclosure — probabilitate mare, impact mare:** cheia deja expusă
   poate fi folosită independent de acest server. Ascunderea ei acum nu o revocă.
2. **Denial of service — probabilitate medie, impact mare:** consum cotă API,
   conexiuni lente, IP spoofing și multe coordonate distincte. Cache limitat,
   buget global și plafoane de conexiuni reduc impactul; atacurile distribuite
   necesită și reguli Cloudflare.
3. **Tampering / spoofing — probabilitate medie, impact mediu:** răspunsuri întârziate,
   cache vechi și locație greșită pot produce informații înșelătoare în UI.

Compromiterea procesului ar putea expune cheia, memoria cu cereri meteo și
fișierele accesibile utilizatorului de sistem `micu`. La începutul auditului acesta era un cont comun
mai multor proiecte. Remedierea finală folosește un utilizator dinamic dedicat,
fără grup Docker, cu socketul Docker inaccesibil și cu filesystem read-only
în serviciu; cheia ajunge în proces prin EnvironmentFile citit de systemd. Nu există
conturi de utilizatori, bază de date sau plăți în această aplicație. Numărul de
utilizatori afectați și pierderea financiară anuală nu pot fi cuantificate din
datele disponibile; nu există o estimare ALE credibilă fără trafic/costuri.

## Detectare și răspuns

- Verificare `/healthz` din exterior la 60 s; alertă după 3 eșecuri. Configurarea
  monitorului extern și destinatarul alertei rămân operațiuni ale proprietarului.
- Urmărește creșteri de 429/503 și erori upstream 502/504 în jurnalul serviciului
  și consumul din dashboardul OpenWeather. Țintă de detectare: sub 5 minute;
  timpul actual nu este măsurat, nu există dovadă de alertare automată funcțională.
- Incident cheie: revocă cheia din contul furnizorului, generează alta, editează
  `.env` (0600), repornește doar `weather-canary`, verifică smoke și consumul.
  Nu publica valoarea în loguri, chat, commituri sau documente.
- Incident aplicație: păstrează logurile cu acces restrâns, oprește doar serviciul
  afectat dacă e necesar, revino la commitul verificat anterior și repornește-l.
  Configurațiile live nginx/systemd sunt salvate separat înainte de schimbare.
- Exercițiu de masă documentar: acces README → identificare cheie → eliminare
  publicare → cerere rotire → verificare. Revocarea reală **nu** s-a executat;
  proprietarul a amânat-o. Nu pretindem un exercițiu operațional complet.

## Date și furnizori

Orașele și coordonatele cerute ajung la furnizorul meteo prin proxy; acesta
vede IP-ul VPS-ului, iar Cloudflare/nginx procesează IP-ul vizitatorului; favoritele și ultimul snapshot se păstrează local în browser.
OpenWeather, Cloudflare și eventual analytics configurat de proprietar sunt în
aria evaluării; contractele/DPA, politica de retenție Cloudflare și setările
conturilor nu au fost accesibile acestui audit. Nu s-au introdus furnizori noi.
Aplicabilitatea și obligațiile juridice trebuie stabilite de operator, pe baza
datelor unui incident concret. Nu se presupune un incident de date personale
doar din expunerea cheii API.

Referințe tehnice: [nginx — moștenirea add_header](https://nginx.org/en/docs/http/ngx_http_headers_module.html),
[Node HTTP](https://nodejs.org/api/http.html),
[W3C Fetch Metadata](https://www.w3.org/TR/fetch-metadata/).

Verdict: remediere tehnică în etape; **riscul cheii compromise rămâne deschis**,
acceptat temporar de proprietar. Accesul public prin Cloudflare a răspuns inițial 403 în mediul de audit și ulterior
200. Verificarea publică finală este consemnată separat mai jos.


## Verificare finală — 2026-11-05

Remedierile din tabelul inițial sunt implementate. Singura excepție explicită
este revocarea/rotirea cheii deja compromise, amânată de proprietar.

- `npm ci --ignore-scripts`: instalare reproductibilă din lockfile.
- `npm run check`: 24 fișiere JS verificate, toate asseturile publice prezente,
  versiuni HTML/importuri/worker aliniate, fără cheie sau HTML dinamic nesigur.
- `npm test`: **31/31** teste trecute, inclusiv buget global upstream, cache în
  octeți, acces HTTP la fișiere interne, metadate stale și validare coordonate.
- `npm run test:browser`: **24/24** scenarii desktop/mobil trecute pe Chromium.
  Offline, storage blocat/corupt/plin, răspuns întârziat, eșec AQI/forecast,
  revenirea unității la eșec, favorite, share și ștergere date locale acoperite.
- axe WCAG A/AA pe ecranul meteo și contrast în toate temele; aceasta nu este
  o certificare WCAG sau o verificare pe dispozitive iOS/Safari reale.
- Verificare vizuală la **320, 390, 768 și 1440 px**, fără overflow orizontal.
- Verificare publică reală prin Cloudflare: HTTP 200, căutare București reușită,
  zero erori JavaScript/CSP și zero cereri către alte origini în sesiunea testată.
- Smoke local și public: meteo, forecast, AQI, geocodare, manifest, worker, robots,
  sitemap și iconițe locale reușite; README/server.js 404, coordonate lipsă 400.
- `nginx -t` reușit; serviciu activ cu `DynamicUser=yes`, utilizator
  `weather-canary`; acces direct la `.env` și acces de scriere Docker refuzate.
- nginx păstrează o singură valoare pentru fiecare header nosniff/frame/referrer,
  fără dubluri backend + proxy. HTML trimite `no-transform` pentru a preveni
  injecțiile Cloudflare incompatibile cu CSP, conform documentației furnizorului.
- `npm audit` la instalare: zero vulnerabilități cunoscute raportate pentru
  pachetele instalate; nu reprezintă dovada absenței tuturor vulnerabilităților.
- Cheia activă nu apare în fișierele sursă/documentele curente urmărite de Git
  sau pregătite pentru commit. Rămâne în `.env` și în istoricul deja expus.

Publicarea din commit fix în `releases/<sha>` și activarea atomică prin `current`
sunt funcționale și verificate prin ID-ul din `/healthz`. Modificările necomise
ale repo-ului nu schimbă site-ul publicat. Nu s-a forțat un eșec în producție
pentru exercițiul de rollback automat.

Rămân operaționale: rotirea cheii, configurarea monitorului extern/destinatarului
alertelor, verificarea setărilor și retenției Cloudflare și publicarea commiturilor
pe remote pentru a executa GitHub Actions. Nu s-a făcut push sau force-push.
SEO nu garantează indexarea; paginile individuale de orașe nu sunt implementate.
Auditul acoperă acest repo, vhostul și serviciul său, nu toate aplicațiile VPS-ului.
