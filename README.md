# Aplicația Vremea

O aplicație web modernă pentru a verifica condițiile meteo actuale și prognoza pe termen scurt, cu suport pentru mai multe limbi și teme vizuale.

---

## Descriere

Această aplicație meteo intuitivă permite utilizatorilor să obțină informații detaliate despre vreme pentru orice oraș din lume, folosind numele orașului sau locația lor curentă. Este construită modular, asigurând o mentenabilitate ușoară și o scalabilitate crescută.

---

## Funcționalități

- **Căutare după oraș:** Introduceți numele oricărui oraș pentru a obține date meteo.
- **Locație curentă:** Utilizați geolocalizarea browserului sau locația bazată pe IP.
- **Unități de temperatură:** Comutați între Celsius (°C) și Fahrenheit (°F).
- **Căutări recente:** Salvează și afișează o listă de căutări recente pentru acces rapid.
- **Vizualizare interval de temperatură:** Indicator vizual pentru temperaturile curente față de min/max prognozate.
- **Detalii meteo complete:** Umiditate, viteza vântului, presiune, răsărit și apus.
- **Suport i18n:** Schimbare limbă interfață (Română, Engleză).
- **Teme vizuale:** Light, dark, dark neon, modern light, playful.
- **Responsive design:** Interfață adaptabilă pentru mobil, tabletă și desktop.
- **Încărcare din URL:** Ex: `index.html?city=Bucuresti`.

---

## Captură de Ecran

![Screenshot cu stilul neon green](images/appScreenshot.jpg)

---

## Instalare și Rulare Locală

Pentru a rula aplicația local, urmați acești pași:

### 1. Clonați depozitul

```bash
git clone https://github.com/Alexandru2984/anotherGo_at_weatherApp_js
cd anotherGo_at_weatherApp_js
```

### 2. Obțineți o cheie API OpenWeatherMap

- Mergeți pe [OpenWeatherMap.org](https://openweathermap.org) și creați un cont
- Generați o cheie API (gratuită)

### 3. Configurați cheia API

Deschideți fișierul `scripts/config.js` și înlocuiți valoarea:

```js
export const OPENWEATHER_API_KEY = "CHEIA_TA_API_OPENWEATHERMAP";
```

### 4. Rulați un server local

Este recomandat să folosiți un server local pentru funcționalități complete (ex: geolocalizare, API):

**Cu Live Server (extensie VS Code):**

- Instalați extensia *Live Server* în VS Code
- Deschideți folderul proiectului
- Click dreapta pe `index.html` → *Open with Live Server*

Aplicația va fi disponibilă la `http://127.0.0.1:5500/` sau `http://localhost:5500/`.

---

## Structura Proiectului

```
.
├── index.html
├── styles/
│   ├── styles.css
│   ├── styles_v1.css
│   ├── styles_v2.css
│   ├── styles_v3.css
│   └── styles_v4.css
├── scripts/
│   ├── app.js
│   ├── config.js
│   ├── api.js
│   ├── ui.js
│   └── utils.js
└── images/
    └── appScreenshot.jpg
```

---

## Tehnologii Folosite

- **HTML5:** Structura paginii web
- **CSS3:** Stilizare, variabile CSS
- **JavaScript (ES6+):** Logica aplicației
- **Font Awesome:** Iconițe

---

## API-uri

- **OpenWeatherMap API:** Date meteo și prognoze
- **IP-API:** Obținere locație pe baza adresei IP

---

## Planuri de Viitor

- Securizarea cheii API prin backend
- Prognoză meteo extinsă (7–14 zile)
- Notificări meteo
- Grafice și vizualizări avansate
- Personalizare temă de către utilizator
- Autentificare și salvare orașe favorite

---

## Contribuții

Contribuțiile sunt binevenite! Urmați acești pași:

1. Fork repo-ul
2. Creați o ramură: `git checkout -b feature/nume-functie`
3. Comiteți modificările: `git commit -m 'Adaugă funcționalitate'`
4. Trimiteți modificările: `git push origin feature/nume-functie`
5. Deschideți un Pull Request

---

## Licență

Acest proiect este licențiat sub licența MIT.

---

## Contact

- **Email:** alex_mihai984@yahoo.com
- **GitHub:** [github.com/Alexandru2984](https://github.com/Alexandru2984)