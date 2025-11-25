# Warenbuchung App

Eine moderne mobile Anwendung für die Verwaltung von Wareneingängen und -ausgängen mit React Native Frontend und ASP.NET Core Backend.

## 🚀 Features

- ✅ **Benutzer-Authentifizierung**: Login und Registrierung mit JWT
- ✅ **Produktverwaltung**: Produkte anzeigen, hinzufügen, suchen
- ✅ **Wareneingänge**: Übersicht aller Wareneingänge
- ✅ **Warenausgänge**: Übersicht aller Warenausgänge
- ✅ **Offline-Funktionalität**: Vollständige App-Nutzung ohne Internetverbindung
- ✅ **Automatische Synchronisation**: Daten werden automatisch mit dem Backend synchronisiert
- ✅ **Moderne UI**: React Native Paper mit Brand-Farben (Hellblau & Dunkelblau)
- ✅ **Cross-Platform**: Funktioniert auf iOS und Android

## 🏗️ Technologie-Stack

### Backend
- **ASP.NET Core 8** - Web API
- **Entity Framework Core** - ORM
- **SQLite** - Datenbank
- **JWT Authentication** - Authentifizierung
- **Swagger/OpenAPI** - API Dokumentation

### Frontend
- **React Native** - Mobile Framework
- **Expo** - Development Platform
- **TypeScript** - Type Safety
- **React Navigation** - Navigation
- **React Native Paper** - UI Components
- **Axios** - HTTP Client
- **Expo SQLite** - Lokale Datenbank

## 📱 Installation und Setup

### Voraussetzungen

1. **Node.js** (Version 20.10.0 oder höher)
2. **.NET 8 SDK**
3. **Expo Go App** auf iPhone/iPad (aus dem App Store)

### Schnellstart (5 Minuten)

#### 1. Backend starten
```bash
cd backend/WarenbuchungApi
dotnet run
```

Das Backend läuft jetzt auf `http://localhost:5232`

#### 2. Frontend starten
```bash
cd frontend/WarenbuchungApp
npm install
npx expo start
```

#### 3. App auf iPhone öffnen
- Öffne **Expo Go** auf deinem iPhone
- Scanne den **QR-Code** im Terminal
- App lädt automatisch

#### 4. Einloggen
- **Admin**: `admin` / `admin123` - Zugriff auf alle Lagerorte
- **User 1**: `user1` / `admin123` - Zugriff auf Lagerort München
- **User 2**: `user2` / `admin123` - Zugriff auf Lagerort Berlin & Hamburg

### Für Entwicklung im gleichen Netzwerk

#### Backend für Netzwerk-Zugriff konfigurieren
Die `launchSettings.json` ist bereits konfiguriert für `0.0.0.0:5232`

#### Frontend API-URL anpassen
In `config.ts` ist die lokale IP bereits konfiguriert:
```typescript
development: 'http://192.168.8.157:5232/api',
```

**Deine IP-Adresse finden:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 📋 Testing auf verschiedenen Geräten

### iOS Simulator (macOS)

1. **Xcode installieren** (über App Store)
2. **iOS Simulator starten**:
   ```bash
   cd frontend/WarenbuchungApp
   npm run ios
   ```

### Android Emulator

1. **Android Studio installieren**
2. **Android SDK und Emulator einrichten**
3. **Emulator starten**:
   ```bash
   cd frontend/WarenbuchungApp
   npm run android
   ```

### Physische Geräte

#### iOS (mit Expo Go)

1. **Expo Go App** aus dem App Store installieren
2. **QR-Code scannen** der im Terminal angezeigt wird
3. **App lädt automatisch** auf dem Gerät

#### Android (mit Expo Go)

1. **Expo Go App** aus dem Google Play Store installieren
2. **QR-Code scannen** der im Terminal angezeigt wird
3. **App lädt automatisch** auf dem Gerät

#### Android (mit APK)

1. **APK erstellen**:
   ```bash
   cd frontend/WarenbuchungApp
   expo build:android
   ```
2. **APK auf Gerät installieren**

## 🔧 Konfiguration

### Backend URL anpassen

In `frontend/WarenbuchungApp/src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000/api';
```

**Für physische Geräte**: Verwenden Sie Ihre lokale IP-Adresse anstelle von `localhost`.

### IP-Adresse finden

**macOS/Linux**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows**:
```cmd
ipconfig | findstr IPv4
```

## 📊 App-Funktionen

### Produkte
- ✅ Produktliste anzeigen
- ✅ Produkte suchen
- ✅ Offline-Modus
- 🔄 Produkt hinzufügen (geplant)
- 🔄 Produkt bearbeiten (geplant)

### Wareneingänge
- ✅ Wareneingänge anzeigen
- ✅ Offline-Modus
- 🔄 Wareneingang hinzufügen (geplant)
- 🔄 Wareneingang bearbeiten (geplant)

### Warenausgänge
- ✅ Warenausgänge anzeigen
- ✅ Offline-Modus
- 🔄 Warenausgang hinzufügen (geplant)
- 🔄 Warenausgang bearbeiten (geplant)

### Benutzerprofil
- ✅ Benutzerinformationen anzeigen
- ✅ Abmelden
- ✅ Verbindungsstatus
- 🔄 Daten synchronisieren (geplant)

## 🔐 Sicherheit

- **JWT Token Authentication**
- **Passwort-Hashing** mit BCrypt
- **CORS** konfiguriert für Cross-Origin Requests
- **HTTPS** in Produktionsumgebung empfohlen

## 📱 Screenshots

Die App bietet eine moderne, intuitive Benutzeroberfläche mit:

- **Login-Screen** mit Anmeldeformular
- **Tab-Navigation** für einfache Bedienung
- **Produktliste** mit Suchfunktion
- **Wareneingang/Warenausgang** Übersichten
- **Offline-Indikator** für Verbindungsstatus

## 🧪 Testing

### User Login Test
Ein Script zum Testen aller Test-User ist verfügbar:

```bash
python3 test_users.py
```

Dies testet:
- ✅ admin / admin123 - Alle Lagerorte
- ✅ user1 / admin123 - Lagerort München
- ✅ user2 / admin123 - Lagerort Berlin, Lagerort Hamburg

## 🐛 Troubleshooting

### Backend startet nicht
- Stellen Sie sicher, dass .NET 8 SDK installiert ist
- Prüfen Sie, ob Port 5232 frei ist

### Frontend startet nicht
- Stellen Sie sicher, dass Node.js installiert ist
- Führen Sie `npm install` erneut aus

### App kann nicht mit Backend kommunizieren
- Prüfen Sie die IP-Adresse in der API-Konfiguration
- Stellen Sie sicher, dass Backend läuft
- Prüfen Sie die Netzwerkverbindung

### Expo Go App zeigt Fehler
- Aktualisieren Sie die Expo Go App
- Starten Sie den Expo Development Server neu

## 🚀 Deployment

### Vollständige Deployment-Anleitung

Siehe detaillierte Anleitungen:
- 📖 **[QUICKSTART-DEPLOYMENT.md](QUICKSTART-DEPLOYMENT.md)** - Schnellstart für Anfänger
- 📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Ausführliche Anleitung
- 📖 **[DEPLOYMENT-OVERVIEW.md](DEPLOYMENT-OVERVIEW.md)** - Übersicht & Vergleich

### Schnell-Deployment

#### Backend (Docker):
```bash
cd backend
docker-compose up -d
```

#### Frontend (iOS App):
```bash
cd frontend/WarenbuchungApp
npx eas build --platform ios --profile preview
```

#### Oder nutze das Deployment-Script:
```bash
./deploy.sh all
```

## 📄 Lizenz

Dieses Projekt ist für Demonstrationszwecke erstellt.

## 🤝 Beitragen

1. Fork das Projekt
2. Erstellen Sie einen Feature Branch
3. Committen Sie Ihre Änderungen
4. Pushen Sie zum Branch
5. Öffnen Sie einen Pull Request

---

**Entwickelt mit ❤️ für moderne Warenbuchung**
