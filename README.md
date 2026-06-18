# ⚡ Macro Tracker

App per il tracking di calorie e macro con:

- Input vocale/testuale con AI
- Database 270+ alimenti italiani
- Barcode scanner con fotocamera
- Ricerca prodotti su Open Food Facts
- Profilo editabile con BMR/TDEE personalizzati
- Storico giornaliero

## Installazione e deploy su GitHub Pages

### 1. Prerequisiti

- [Node.js](https://nodejs.org) (versione 18+)
- Account [GitHub](https://github.com)

### 2. Setup locale

```bash
npm install
npm run dev
```

Apri <http://localhost:5173>

### 3. Deploy su GitHub Pages

**Opzione A — GitHub Actions (automatico)**

1. Crea un repository su GitHub (es. `macro-tracker`)
1. Carica tutti i file di questa cartella
1. Vai su Settings → Pages → Source: **GitHub Actions**
1. Crea il file `.github/workflows/deploy.yml` con il contenuto qui sotto
1. Ogni push su `main` fa il deploy automatico

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Opzione B — Deploy manuale**

```bash
npm run build
# Carica la cartella `dist` su qualsiasi hosting statico
```

### 4. Aggiungi alla Home Screen iPhone

1. Apri l’URL su Safari
1. Tasto Condividi → “Aggiungi a schermata Home”
1. L’app funziona come app nativa con fotocamera e localStorage

## Note

- I dati sono salvati in **localStorage** del browser — persistono tra sessioni
- Il barcode scanner usa **html5-qrcode** + **Open Food Facts** (gratuito)
- L’AI per gli alimenti sconosciuti usa l’API Anthropic