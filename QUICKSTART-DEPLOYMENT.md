# ⚡ Schnellstart: App veröffentlichen

## 🎯 Einfachste Methode (für Anfänger)

### 📱 **iOS App erstellen (ca. 30 Minuten)**

1. **Expo Account erstellen** (kostenlos)
   ```bash
   cd frontend/WarenbuchungApp
   npx expo login
   ```

2. **iOS Build starten**
   ```bash
   npx eas build --platform ios --profile preview
   ```
   
   Folge den Anweisungen:
   - Gib deine Apple Developer Credentials ein
   - Warte 10-20 Minuten
   - Du bekommst einen Download-Link

3. **App auf iPhone installieren**
   - Öffne den Link auf deinem iPhone
   - Installiere über TestFlight oder direkt

---

### 🖥️ **Backend auf Server deployen (ca. 1 Stunde)**

#### Option A: DigitalOcean (Empfohlen - $6/Monat)

1. **Account erstellen**
   - Gehe zu https://www.digitalocean.com
   - Erstelle einen Account
   - Erstelle einen "Droplet" (Ubuntu 22.04, $6/Monat)

2. **Server vorbereiten**
   ```bash
   # SSH in deinen Server:
   ssh root@deine-server-ip
   
   # Docker installieren:
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose -y
   ```

3. **Backend hochladen**
   ```bash
   # Von deinem Mac:
   cd /Users/adammechouate/Documents/Warenbuchung-App
   scp -r backend/ root@deine-server-ip:/root/warenbuchung/
   ```

4. **Backend starten**
   ```bash
   # Auf dem Server:
   cd /root/warenbuchung/backend
   docker-compose up -d
   
   # Prüfen ob es läuft:
   docker-compose logs -f
   ```

5. **Domain einrichten** (Optional aber empfohlen)
   - Kaufe eine Domain (z.B. bei Namecheap: ~$10/Jahr)
   - Erstelle A-Record: `api.deine-domain.com` → Server-IP
   - Warte 1-2 Stunden

6. **HTTPS einrichten**
   ```bash
   # Nginx installieren:
   apt install nginx certbot python3-certbot-nginx -y
   
   # Nginx konfigurieren (siehe DEPLOYMENT.md)
   nano /etc/nginx/sites-available/warenbuchung
   
   # SSL-Zertifikat:
   certbot --nginx -d api.deine-domain.com
   ```

7. **Frontend-URL aktualisieren**
   ```bash
   # In config.ts:
   production: 'https://api.deine-domain.com/api',
   ```

8. **Neuen iOS Build erstellen**
   ```bash
   cd frontend/WarenbuchungApp
   npx eas build --platform ios --profile production
   ```

---

#### Option B: Heroku (Noch einfacher - $7/Monat)

1. **Heroku Account erstellen**
   - Gehe zu https://heroku.com
   - Erstelle einen Account

2. **Heroku CLI installieren**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

3. **App deployen**
   ```bash
   cd backend/WarenbuchungApi
   heroku login
   heroku create warenbuchung-api
   
   # Buildpack hinzufügen:
   heroku buildpacks:set https://github.com/jincod/dotnetcore-buildpack
   
   # Deployen:
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

4. **URL in Frontend aktualisieren**
   ```typescript
   production: 'https://warenbuchung-api.herokuapp.com/api',
   ```

---

## 🎬 Zusammenfassung: Was du brauchst

### Kosten:
- ✅ **Apple Developer Account**: $99/Jahr (für App Store)
- ✅ **Server**: $6-10/Monat (DigitalOcean/Heroku)
- ✅ **Domain**: $10/Jahr (optional)
- **Gesamt**: ~$200/Jahr

### Zeit:
- ✅ **iOS App Build**: 30 Minuten
- ✅ **Backend Deployment**: 1 Stunde
- ✅ **Domain + HTTPS**: 30 Minuten
- **Gesamt**: ~2 Stunden

### Ohne Apple Developer Account:
Du kannst die App auch **nur für dich** installieren:
```bash
# Development Build (ohne App Store):
npx eas build --platform ios --profile development
```
Dann kannst du die App direkt auf dein iPhone installieren (max. 100 Geräte).

---

## 🚀 Nächste Schritte

1. **Teste lokal** (bereits erledigt ✅)
2. **Erstelle Expo Account**
3. **Erstelle ersten iOS Build** (Development)
4. **Miete einen Server** (DigitalOcean empfohlen)
5. **Deploye Backend**
6. **Aktualisiere Frontend-URL**
7. **Erstelle Production Build**
8. **Veröffentliche im App Store**

---

## 💬 Fragen?

- Expo Community: https://forums.expo.dev
- Stack Overflow: https://stackoverflow.com/questions/tagged/expo
- Discord: https://chat.expo.dev

Viel Erfolg! 🎉







































