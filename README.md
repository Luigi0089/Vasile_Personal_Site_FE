# 📌 Vasile Personal Site – Frontend

Frontend sviluppato in **Angular 17+** per il sito personale di **Luigi Vasile**.  
Gestisce l’interfaccia utente per:

- visualizzare le skill, le categorie e i progetti GitHub,
- leggere i README dei progetti,
- prenotare lezioni private,
- interagire con il backend tramite API REST,
- offrire una UI moderna, elegante e completamente responsive (desktop + mobile).

---

# 🚀 Tech Stack

- **Angular 17+**
- **TypeScript**
- **SCSS (global + component-based)**
- **Angular Router**
- **Reactive Forms**
- **Angular SSR / Universal**
- **Node.js 20+**

---

#📂 Struttura del progetto

```text
Vasile_Personal_Site
│
├── .angular/                   # Configurazioni interne Angular
├── .vscode/                    # Config per editor
├── dist/                       # Build di produzione
├── node_modules/               # Dipendenze
│
├── public/                     # Asset pubblici
│
├── src/
│   ├── app/                    # Componenti principali
│   ├── Constants/              # Costanti e configurazioni FE
│   ├── DTO/                    # Modelli dei dati (DTO)
│   ├── environments/           # environment.ts / prod
│   ├── Service/                # Service Angular (chiamate API)
│   │   ├── index.html          # Entry per SSR
│   │   ├── main.server.ts      # SSR runtime
│   │   ├── main.ts             # Bootstrap FE
│   │   ├── server.ts           # SSR server
│   │   └── styles.scss         # Stile globale
│   │
│   └── index.html              # Entry generale
│
├── .editorconfig
├── .gitignore
├── angular.json                # Configurazione Angular
├── package.json                # Dependency manager
├── package-lock.json
└── tsconfig*.json              # Config TS
```

---

## 🔌 API utilizzate dal Frontend

Le principali funzionalità integrate sono:

### ⚙️ Stack & Progetti
- `/stack/progetti`
- `/stack/readme`

### 🧠 Skill, categorie, keyword
- `/stack/skills`
- `/stack/categories`
- `/stack/keywords`

### 🎓 Prenotazioni lezioni
- `/lezioni`
- `/lezioni/modifica`
- `/lezioni/annulla`
- `/lezioni/settimana`

---

## 🧪 Development

### Installazione dipendenze
```bash
npm install
```

### Avvio ambiente di sviluppo
```bash
npm run start
```

Il sito sarà disponibile su: 
```bash
http://localhost:4200
```

## 🏗️ Build produzione

```bash
ng build
```
La build sarà disponibile in:
```bash
/dist/vasile-personal-site
```
---

## 🌐 Deploy su Render / SSR

Il progetto supporta **Angular SSR (Server-Side Rendering)**.

### Build SSR

```bash
npm run build:ssr
```

### Avvio SSR locale

```bash
npm run serve:ssr
```

### Configurazione Render

- **Build Command**: `npm install && npm run build:ssr`
- **Start Command**: `npm run serve:ssr`
- **Runtime**: Node 20

---

## 📄 Licenza

Questo repository è pubblicato per **visione del codice**, ma la proprietà rimane di **Luigi Vasile**.  
L’uso non autorizzato non è consentito.

---

## 👤 Autore

**Luigi Francesco Vasile**  
Full Stack Developer  
🌐 https://vasile-luigi.onrender.com






