# Plan de produs

Obiectiv: vreme utilă și ușor de explorat, fără cont obligatoriu, funcțională
pe mobil și desktop, cu date și stări de eroare corecte. Fiecare etapă are commit
separat, teste proporționale și validare prin originea nginx înainte de închidere.

## 1. Închiderea expunerii

- [x] Audit repo, configurație live, identitate Git și teste existente.
- [x] Eliminare cheie din README sursă și copia publicată.
- [x] Documentare risc, model de amenințări și pași de incident.
- [ ] Rotire cheie OpenWeather — amânată explicit de proprietar.

## 2. Server și deploy

- [ ] Allowlist de fișiere publice, blocare symlink-uri/private paths.
- [ ] Validare strictă, IP-uri de încredere, buget upstream global și timeouturi.
- [ ] Erori sigure, răspunsuri limitate și cache stale etichetat.
- [ ] Un singur traseu nginx → Node, fără copii publice ale repo-ului.
- [ ] Loguri fără coordonate/query și restart verificat al serviciului propriu.

## 3. Corectitudinea aplicației

- [ ] Anularea cererilor depășite, AQI opțional, mesaje utile de eroare.
- [ ] Storage indisponibil/corupt, snapshot validat și starea offline vizibilă.
- [ ] Favorite și partajare care păstrează coordonatele orașului ales.
- [ ] Fără solicitare automată de geolocalizare la prima vizită.
- [ ] Worker cu cache finit și shell complet utilizabil offline.

## 4. Experiență și funcții interactive

- [ ] Dashboard responsive cu antet, onboarding și scurtături către orașe.
- [ ] Prognoză zilnică agregată în fusul orașului: min/max, ploaie și vânt.
- [ ] Selectarea zilei pentru intervalele de 3 ore și grafic.
- [ ] Grafic comutabil temperatură / probabilitate ploaie / vânt.
- [ ] Planificator pentru plimbare, alergare, ciclism: intervale potrivite,
  criterii explicite, fără a le prezenta ca avertizări oficiale sau garanții.
- [ ] Rezumat următoarele 24 h: variație temperatură, precipitații, vânt.
- [ ] Stare conexiune, vechime date, reîncercare și ștergere date locale.
- [ ] Interfață RO/EN, tastatură, focus, reduced motion și verificare mobil.

## 5. La final: SEO și CI

- [ ] Titlu/descriere, canonical, Open Graph, robots și sitemap.
- [ ] Teste de integrare HTTP cu upstream simulat, fără chei reale.
- [ ] Teste browser cu date deterministe, inclusiv mobil/offline/race conditions.
- [ ] CI cu permisiuni minime, verificări de sintaxă, Node LTS și browser.
- [ ] Documentație de rulare, smoke și limite cunoscute.

## Extensii ulterioare, care cer date sau infrastructură suplimentară

Prioritate după validarea utilizării reale: comparație simultană între orașe,
export calendar al unui interval ales, hartă radar cu sursă/licență clară,
alerte oficiale CAP, UV/polen și prognoză 7–14 zile numai cu API compatibil,
notificări push opt-in cu backend și dezabonare. Conturile și sincronizarea
favoritelor se justifică numai dacă există cerere; adaugă cost de operare și date
personale. Nu se afișează indicatori pe care API-ul actual nu îi furnizează.
