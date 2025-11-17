# TalentBinder Frontend

## Deployment-Konfiguration

### Repository
- **Standort**: GitLab (oder dein Git-Provider)
- **Default Branch**: `main`

### Web-Adressen
- **Produktion**: `https://talentbinder.com` (Beispiel-Domain)

### JavaScript-Skripte
Die folgenden Skripte sind in der `package.json` definiert:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### Globale Abhängigkeiten
- **Node.js**: Version 18 oder höher
- **npm**: Wird automatisch mit Node.js installiert

### Projekt-Abhängigkeiten

**Laufzeit-Abhängigkeiten:**
- `jwt-decode`: ^4.0.0
- `react`: ^19.1.1
- `react-dom`: ^19.1.1
- `react-router-dom`: ^7.9.1
- `react-icons`: ^4.11.0

**Entwicklungs-Abhängigkeiten:**
- `@eslint/js`: ^9.35.0
- `@types/react`: ^19.1.13
- `@types/react-dom`: ^19.1.9
- `@vitejs/plugin-react`: ^5.0.2
- `eslint`: ^9.35.0
- `eslint-plugin-react-hooks`: ^5.2.0
- `eslint-plugin-react-refresh`: ^0.4.20
- `globals`: ^16.4.0
- `sass`: ^1.93.1
- `typescript`: ~5.8.3
- `typescript-eslint`: ^8.43.0
- `vite`: ^7.1.6

### Dateistruktur
Alle wichtigen Dateien befinden sich im `frontend`-Verzeichnis:
- `package.json`
- `vite.config.ts`
- `README.md`
- `public/` (Statische Assets)
- `src/` (React-Quellcode)

### Framework
- **Typ**: JavaScript Client-Side (React mit Vite und TypeScript)
- **Server-seitig**: Nein

---

## Quick-Setup-Befehle

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Entwicklungsserver starten
```bash
npm run dev
# Läuft standardmäßig auf http://localhost:5173
```

### 3. Produktions-Build erstellen
```bash
# Erstellt den `dist/`-Ordner mit den statischen Dateien
npm run build
```

---

## Produktions-Deployment (mit Nginx)

### 1. Umgebungsvariable für die API
Erstelle eine Datei namens `.env.production` im `frontend`-Verzeichnis mit der URL deines Backends:
```
# frontend/.env.production
VITE_API_URL=https://talentbinder.com/api
```

### 2. Build-Dateien auf den Server kopieren
Übertrage den Inhalt des `dist`-Ordners auf deinen Server, z.B. nach `/var/www/talentbinder-frontend`.

### 3. Nginx als Reverse Proxy konfigurieren
Erstelle eine Nginx-Konfigurationsdatei (z.B. `/etc/nginx/sites-available/talentbinder`), um das Frontend auszuliefern und die API-Anfragen an das Backend weiterzuleiten.

```nginx
# /etc/nginx/sites-available/talentbinder
server {
    listen 80;
    server_name talentbinder.com;

    # Pfad zum Frontend
    root /var/www/talentbinder-frontend;
    index index.html;

    # Reverse Proxy für das Backend
    location /api/ {
        proxy_pass https://talentbinder-backend.onrender.com/; # Port des Backends
        proxy_set_header Host $host;
        # Weitere proxy-Header...
    }

    # SPA-Fallback für das Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Nginx aktivieren
```bash
# Konfiguration aktivieren und Nginx neu laden
sudo ln -s /etc/nginx/sites-available/talentbinder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```


