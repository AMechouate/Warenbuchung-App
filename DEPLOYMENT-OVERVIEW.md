# 🗺️ Deployment Übersicht - Warenbuchung App

## 📊 Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUKTION                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                    ┌──────────────────┐   │
│  │   iPhone     │                    │     Server       │   │
│  │              │                    │                  │   │
│  │  ┌────────┐  │   HTTPS/Internet   │  ┌────────────┐ │   │
│  │  │  App   │──┼────────────────────┼─→│   Nginx    │ │   │
│  │  │ (iOS)  │  │                    │  │  (HTTPS)   │ │   │
│  │  └────────┘  │                    │  └──────┬─────┘ │   │
│  │              │                    │         │       │   │
│  └──────────────┘                    │  ┌──────▼─────┐ │   │
│                                      │  │  Backend   │ │   │
│                                      │  │  (.NET 8)  │ │   │
│                                      │  └──────┬─────┘ │   │
│                                      │         │       │   │
│                                      │  ┌──────▼─────┐ │   │
│                                      │  │  SQLite    │ │   │
│                                      │  │    DB      │ │   │
│                                      │  └────────────┘ │   │
│                                      └──────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment-Optionen im Vergleich

### 📱 **iOS App**

| Option | Schwierigkeit | Kosten | Zeit | Empfehlung |
|--------|--------------|--------|------|------------|
| **TestFlight** | ⭐⭐ Mittel | $99/Jahr | 30 Min | ✅ Beste für Tests |
| **App Store** | ⭐⭐⭐ Schwer | $99/Jahr | 2-3 Tage | ✅ Für öffentliche App |
| **Development** | ⭐ Einfach | $99/Jahr | 20 Min | ✅ Für private Nutzung |

### 🖥️ **Backend Server**

| Option | Schwierigkeit | Kosten | Zeit | Empfehlung |
|--------|--------------|--------|------|------------|
| **DigitalOcean** | ⭐⭐ Mittel | $6/Monat | 1 Std | ✅ Beste Preis/Leistung |
| **Heroku** | ⭐ Einfach | $7/Monat | 15 Min | ✅ Am einfachsten |
| **AWS EC2** | ⭐⭐⭐ Schwer | $10/Monat | 2 Std | Für große Apps |
| **Azure** | ⭐⭐ Mittel | $10/Monat | 1 Std | Gut für .NET |
| **Eigener Server** | ⭐⭐⭐⭐ Sehr schwer | Variabel | 3+ Std | Nur für Experten |

---

## 🚀 Empfohlener Workflow

### Phase 1: Entwicklung (Jetzt) ✅
```
iPhone ──WiFi──→ Mac (Backend)
         (lokales Netzwerk)
```
- ✅ Backend läuft auf Mac
- ✅ App über Expo Go testen
- ✅ Schnelle Entwicklung

### Phase 2: Beta-Testing
```
iPhone ──Internet──→ Server (Backend)
         (TestFlight)
```
- 📱 App über TestFlight verteilen
- 🖥️ Backend auf DigitalOcean
- 👥 Interne Tester einladen (bis 100 Personen)

### Phase 3: Produktion
```
iPhone ──Internet──→ Server (Backend)
         (App Store)
```
- 📱 App im App Store veröffentlichen
- 🖥️ Backend auf professionellem Server
- 🔒 HTTPS + Domain
- 📊 Monitoring + Backups

---

## 📋 Checkliste für Produktion

### Vor dem Deployment:

#### Backend
- [ ] JWT Secret Key ändern (nicht den Standard-Key verwenden!)
- [ ] CORS für Production konfigurieren
- [ ] Logging einrichten
- [ ] Datenbank-Backups planen
- [ ] Error Handling testen
- [ ] Performance testen

#### Frontend
- [ ] Production API-URL konfigurieren
- [ ] App-Icons und Splash Screen erstellen
- [ ] App-Name und Bundle Identifier setzen
- [ ] Privacy Policy erstellen (für App Store)
- [ ] Screenshots für App Store machen
- [ ] App-Beschreibung schreiben

---

## 🔧 Wichtige Konfigurationsdateien

### Backend
```
backend/
├── WarenbuchungApi/
│   ├── Dockerfile                      # Docker Build
│   ├── appsettings.Production.json    # Prod-Konfiguration
│   └── Properties/
│       └── launchSettings.json        # Server-Einstellungen
└── docker-compose.yml                 # Docker Orchestrierung
```

### Frontend
```
frontend/WarenbuchungApp/
├── app.json                           # Expo Konfiguration
├── eas.json                          # Build Konfiguration
└── config.ts                         # API URLs
```

---

## 🆘 Troubleshooting

### Problem: "App kann Backend nicht erreichen"

**Lösung:**
1. Prüfe Firewall auf Server:
   ```bash
   sudo ufw status
   sudo ufw allow 5232
   ```

2. Teste API direkt:
   ```bash
   curl https://deine-domain.com/api/products
   ```

3. Prüfe CORS-Konfiguration in `Program.cs`

### Problem: "iOS Build schlägt fehl"

**Lösung:**
1. Prüfe Apple Developer Account
2. Schaue Build Logs an:
   ```bash
   npx eas build:list
   ```
3. Prüfe `app.json` Konfiguration

### Problem: "SSL-Zertifikat Fehler"

**Lösung:**
1. Prüfe DNS-Einträge:
   ```bash
   nslookup api.deine-domain.com
   ```
2. Warte auf DNS-Propagation (bis 24h)
3. Führe Certbot erneut aus:
   ```bash
   sudo certbot --nginx -d api.deine-domain.com
   ```

---

## 📞 Support & Ressourcen

### Dokumentation:
- **Expo**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **.NET Deployment**: https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/
- **Docker**: https://docs.docker.com

### Video-Tutorials:
- Expo EAS Build: https://www.youtube.com/watch?v=BpkCH-0uHtM
- DigitalOcean Setup: https://www.youtube.com/watch?v=kR06NoSzAXY
- Docker für .NET: https://www.youtube.com/watch?v=f0lMGPB10bM

### Communities:
- Expo Discord: https://chat.expo.dev
- Stack Overflow: https://stackoverflow.com/questions/tagged/expo
- Reddit: r/reactnative

---

## 💰 Kosten-Rechner

### Minimale Kosten (Private Nutzung):
- Apple Developer: $99/Jahr
- DigitalOcean: $6/Monat = $72/Jahr
- **Gesamt: ~$171/Jahr** (~$14/Monat)

### Empfohlene Kosten (Beta-Testing):
- Apple Developer: $99/Jahr
- DigitalOcean: $12/Monat = $144/Jahr
- Domain: $10/Jahr
- **Gesamt: ~$253/Jahr** (~$21/Monat)

### Professionelle Kosten (App Store):
- Apple Developer: $99/Jahr
- DigitalOcean/AWS: $20/Monat = $240/Jahr
- Domain: $10/Jahr
- SSL: Kostenlos (Let's Encrypt)
- Monitoring: $10/Monat = $120/Jahr
- **Gesamt: ~$469/Jahr** (~$39/Monat)

---

## 🎓 Lernressourcen

### Für Deployment:
1. **Expo EAS Build Tutorial**: https://docs.expo.dev/build/setup/
2. **Docker Tutorial**: https://docker-curriculum.com/
3. **Nginx Tutorial**: https://www.nginx.com/resources/wiki/start/

### Für App Store:
1. **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
2. **TestFlight Guide**: https://developer.apple.com/testflight/
3. **App Store Connect**: https://help.apple.com/app-store-connect/

---

## ✅ Quick Start Befehle

### Backend lokal testen:
```bash
cd backend
docker-compose up
```

### Frontend bauen:
```bash
cd frontend/WarenbuchungApp
npx eas build --platform ios --profile development
```

### Alles deployen:
```bash
./deploy.sh all
```

---

Viel Erfolg mit dem Deployment! 🚀







































