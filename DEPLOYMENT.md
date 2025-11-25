# 🚀 Deployment Anleitung - Warenbuchung App

## 📱 Frontend: iOS App erstellen und veröffentlichen

### Voraussetzungen
- Apple Developer Account ($99/Jahr) - https://developer.apple.com
- Expo Account (kostenlos) - https://expo.dev

### Schritt 1: Expo EAS CLI installieren
```bash
npm install -g eas-cli
```

### Schritt 2: Bei Expo anmelden
```bash
cd frontend/WarenbuchungApp
npx expo login
```

### Schritt 3: EAS Build konfigurieren
```bash
npx eas build:configure
```

Dies erstellt eine `eas.json` Datei. Bearbeite sie:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

### Schritt 4: app.json aktualisieren

Wichtige Felder in `app.json`:
```json
{
  "expo": {
    "name": "Warenbuchung App",
    "slug": "warenbuchung-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.deinefirma.warenbuchung",
      "buildNumber": "1"
    }
  }
}
```

### Schritt 5: Server-URL konfigurieren

In `config.ts` die Production-URL anpassen:
```typescript
export const API_CONFIG = {
  development: 'http://192.168.8.157:5232/api',
  production: 'https://deine-domain.com/api', // ← Hier deine Server-URL
};
```

### Schritt 6: iOS Build erstellen

**Für TestFlight (interne Tests):**
```bash
npx eas build --platform ios --profile preview
```

**Für App Store:**
```bash
npx eas build --platform ios --profile production
```

Der Build dauert ca. 10-20 Minuten. Du bekommst einen Link zur `.ipa` Datei.

### Schritt 7: App auf iPhone installieren

**Option A: TestFlight**
1. Gehe zu App Store Connect - https://appstoreconnect.apple.com
2. Erstelle eine neue App
3. Lade die `.ipa` Datei hoch
4. Füge interne Tester hinzu
5. Tester bekommen eine E-Mail mit TestFlight-Link

**Option B: Direkter Download (Development Build)**
```bash
npx eas build --platform ios --profile development
```
Installiere die App direkt über den QR-Code oder Link.

---

## 🖥️ Backend: Auf Server deployen

### Option 1: Docker Deployment (Empfohlen)

#### Schritt 1: Docker auf Server installieren
```bash
# Auf Ubuntu/Debian Server:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose
```

#### Schritt 2: Backend auf Server kopieren
```bash
# Von deinem Mac:
scp -r backend/ user@dein-server:/home/user/warenbuchung/
```

#### Schritt 3: Docker Container starten
```bash
# Auf dem Server:
cd /home/user/warenbuchung/backend
docker-compose up -d
```

Das Backend läuft jetzt auf Port 5232!

#### Schritt 4: Nginx als Reverse Proxy (für HTTPS)

Installiere Nginx und Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Nginx Konfiguration (`/etc/nginx/sites-available/warenbuchung`):
```nginx
server {
    listen 80;
    server_name deine-domain.com;

    location /api {
        proxy_pass http://localhost:5232/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktiviere die Konfiguration:
```bash
sudo ln -s /etc/nginx/sites-available/warenbuchung /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

SSL-Zertifikat mit Let's Encrypt:
```bash
sudo certbot --nginx -d deine-domain.com
```

Jetzt ist dein Backend über HTTPS erreichbar: `https://deine-domain.com/api`

---

### Option 2: Hosting-Anbieter

#### A) **DigitalOcean App Platform**
1. Gehe zu https://cloud.digitalocean.com
2. Erstelle eine neue App
3. Verbinde dein Git Repository
4. Wähle ".NET" als Runtime
5. Konfiguriere Umgebungsvariablen
6. Deploy!

Kosten: ~$5-10/Monat

#### B) **Azure App Service**
1. Gehe zu https://portal.azure.com
2. Erstelle eine "Web App"
3. Wähle ".NET 8" als Runtime
4. Deploye mit Visual Studio oder CLI:
```bash
cd backend/WarenbuchungApi
dotnet publish -c Release
# Dann in Azure Portal hochladen
```

Kosten: ~$10-50/Monat

#### C) **AWS Elastic Beanstalk**
1. Gehe zu https://aws.amazon.com
2. Erstelle eine Elastic Beanstalk Umgebung
3. Wähle ".NET" als Plattform
4. Deploye deine App

Kosten: ~$10-30/Monat

#### D) **Heroku** (Einfachste Option)
```bash
# Heroku CLI installieren
brew tap heroku/brew && brew install heroku

# Login
heroku login

# App erstellen
cd backend/WarenbuchungApi
heroku create warenbuchung-api

# Deployen
git push heroku main
```

Kosten: $7-25/Monat

---

## 🔧 Produktions-Checkliste

### Backend
- ✅ Dockerfile erstellt
- ✅ docker-compose.yml erstellt
- ✅ appsettings.Production.json erstellt
- ⚠️ **WICHTIG:** Ändere `Jwt:Key` in `appsettings.Production.json` zu einem sicheren, zufälligen String!
- ⚠️ Konfiguriere HTTPS (mit Nginx + Let's Encrypt oder Cloud-Provider)
- ⚠️ Sichere die Datenbank (Backups einrichten)

### Frontend
- ✅ config.ts erstellt für Umgebungsvariablen
- ⚠️ Aktualisiere `production` URL in `config.ts` mit deiner Server-Domain
- ⚠️ Teste die App im Production-Modus vor dem Build
- ⚠️ Aktualisiere `app.json` mit korrekten Bundle Identifier

---

## 🎯 Schnellstart für Produktion

### 1. Backend auf Server deployen (Docker)
```bash
# Auf deinem Server:
cd /home/user/warenbuchung/backend
docker-compose up -d

# Logs anschauen:
docker-compose logs -f
```

### 2. Domain auf Server zeigen lassen
- Kaufe eine Domain (z.B. bei Namecheap, GoDaddy)
- Erstelle einen A-Record: `api.deine-domain.com` → Server-IP
- Warte 1-24 Stunden für DNS-Propagation

### 3. HTTPS einrichten
```bash
sudo certbot --nginx -d api.deine-domain.com
```

### 4. Frontend-URL aktualisieren
In `frontend/WarenbuchungApp/config.ts`:
```typescript
production: 'https://api.deine-domain.com/api',
```

### 5. iOS App bauen
```bash
cd frontend/WarenbuchungApp
npx eas build --platform ios --profile production
```

### 6. App in App Store hochladen
1. Gehe zu https://appstoreconnect.apple.com
2. Erstelle neue App
3. Lade die `.ipa` Datei hoch
4. Fülle App-Informationen aus
5. Reiche zur Review ein

---

## 💡 Empfohlene Hosting-Optionen

### Für Anfänger:
1. **Heroku** - Am einfachsten, aber teurer
2. **DigitalOcean App Platform** - Gutes Preis-Leistungs-Verhältnis

### Für Fortgeschrittene:
1. **DigitalOcean Droplet** + Docker - Flexibel und günstig ($6/Monat)
2. **AWS EC2** + Docker - Sehr skalierbar
3. **Azure App Service** - Gut für .NET Apps

### Für Profis:
1. **Kubernetes** (GKE, EKS, AKS)
2. **Eigener Server** mit Docker

---

## 🔒 Sicherheits-Tipps

1. **Ändere den JWT Secret Key!**
   ```bash
   # Generiere einen sicheren Key:
   openssl rand -base64 64
   ```

2. **Verwende HTTPS** (immer!)

3. **Sichere die Datenbank**
   - Regelmäßige Backups
   - Nicht öffentlich zugänglich

4. **Firewall konfigurieren**
   ```bash
   # Nur Port 80, 443, 22 öffnen
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

5. **Umgebungsvariablen verwenden**
   - Niemals Secrets in Code committen!

---

## 📊 Monitoring & Logs

### Backend Logs anschauen:
```bash
# Docker:
docker-compose logs -f

# Direkt auf Server:
journalctl -u warenbuchung-api -f
```

### App Analytics:
- Expo Analytics (eingebaut)
- Firebase Analytics
- Sentry für Error Tracking

---

## 🆘 Hilfe & Support

### Nützliche Links:
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- .NET Deployment: https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/
- Docker Docs: https://docs.docker.com

### Häufige Probleme:

**Problem: App kann Backend nicht erreichen**
- ✅ Prüfe Firewall auf Server
- ✅ Prüfe CORS-Konfiguration
- ✅ Teste API mit curl: `curl https://deine-domain.com/api/products`

**Problem: iOS Build schlägt fehl**
- ✅ Prüfe Apple Developer Account
- ✅ Prüfe Bundle Identifier
- ✅ Schaue EAS Build Logs an

**Problem: SSL-Zertifikat Fehler**
- ✅ Prüfe DNS-Einträge
- ✅ Warte auf DNS-Propagation
- ✅ Führe `certbot` erneut aus







































