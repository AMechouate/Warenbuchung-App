# 🏗️ Warenbuchung App - Architektur-Übersicht

## 📋 Inhaltsverzeichnis
- [High-Level Übersicht](#high-level-übersicht)
- [Frontend-Architektur](#frontend-architektur)
- [Backend-Architektur](#backend-architektur)
- [Datenfluss](#datenfluss)
- [API-Endpoints](#api-endpoints)

---

## High-Level Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE APP (React Native)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │   Screens    │→ │   Services   │→ │   Local Storage  │     │
│  │              │  │              │  │                  │     │
│  │ • Login      │  │ • API Client │  │ • Secure Store   │     │
│  │ • Main       │  │ • SQLite     │  │ • SQLite DB      │     │
│  │ • Products   │  │              │  │                  │     │
│  │ • Bookings   │  │              │  │                  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (ASP.NET Core)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ Controllers  │→ │ Middleware   │→ │   Data Layer     │     │
│  │              │  │              │  │                  │     │
│  │ • /auth      │  │ • JWT Auth   │  │ • DbContext      │     │
│  │ • /products  │  │ • CORS       │  │ • EF Core        │     │
│  │ • /waren*    │  │ • Swagger    │  │ • Migrations     │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
│                              │                                   │
│                              ▼                                   │
│                     ┌──────────────────┐                        │
│                     │  SQLite Database │                        │
│                     │  (warenbuchung.db)│                        │
│                     └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend-Architektur

### Navigation Structure

```
App.tsx (Root)
│
├─ Stack Navigator
│  ├─ LoginScreen
│  ├─ RegisterScreen
│  ├─ MainScreen
│  │  └─ Tab Navigator
│  │     ├─ ProductsScreen
│  │     ├─ WareneingaengeScreen
│  │     ├─ WarenausgaengeScreen
│  │     └─ ProfileScreen
│  ├─ ProjectMaterialsScreen
│  └─ ItemHistoryScreen
```

### Services Layer

#### **ApiService** (`src/services/api.ts`)
- **Zweck**: Kommunikation mit Backend-API
- **Features**:
  - Axios HTTP Client Konfiguration
  - Automatische JWT Token Injection
  - Request/Response Interceptors
  - Error Handling (401 → Re-login)
- **Methoden**:
  - Authentication: `login()`, `register()`, `logout()`, `isAuthenticated()`
  - Products: `getProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`
  - Wareneingaenge: `getWareneingaenge()`, `createWareneingang()`, etc.
  - Warenausgaenge: `getWarenausgaenge()`, `createWarenausgang()`, etc.

#### **DatabaseService** (`src/services/database.ts`)
- **Zweck**: Offline-First Datenhaltung
- **Features**:
  - SQLite Database Initialization
  - CRUD Operations für alle Entitäten
  - Sync Queue Management
  - Dirty Flag Tracking
- **Tabellen**:
  - `products` - Produktdaten
  - `wareneingaenge` - Wareneingangs-Transaktionen
  - `warenausgaenge` - Warenausgangs-Transaktionen
  - `sync_queue` - Offline-Änderungen für Synchronisation

### Storage

#### **Expo Secure Store**
- Speichert JWT Tokens sicher
- Speichert User-Daten
- Keychain auf iOS / Keystore auf Android

#### **Expo SQLite**
- Lokale Offline-Datenbank
- Synchronisation mit Backend bei Online-Verbindung
- Dirty Flag System für Offline-Änderungen

---

## Backend-Architektur

### Controllers

#### **AuthController** (`/auth`)
```
POST   /auth/login      - Benutzer-Login
POST   /auth/register   - Benutzer-Registrierung
GET    /auth/me         - Aktueller Benutzer (mit Token)
```

#### **ProductsController** (`/products`)
```
GET    /products              - Alle Produkte
GET    /products/{id}         - Einzelnes Produkt
GET    /products/search      - Produkt-Suche
POST   /products              - Neues Produkt
PUT    /products/{id}         - Produkt aktualisieren
DELETE /products/{id}         - Produkt löschen
```

#### **WareneingaengeController** (`/wareneingaenge`)
```
GET    /wareneingaenge        - Alle Wareneingaenge
GET    /wareneingaenge/{id}   - Einzelner Wareneingang
POST   /wareneingaenge        - Neuer Wareneingang
PUT    /wareneingaenge/{id}   - Wareneingang aktualisieren
DELETE /wareneingaenge/{id}   - Wareneingang löschen
```

#### **WarenausgaengeController** (`/warenausgaenge`)
```
GET    /warenausgaenge        - Alle Warenausgaenge
GET    /warenausgaenge/{id}   - Einzelner Warenausgang
POST   /warenausgaenge        - Neuer Warenausgang
PUT    /warenausgaenge/{id}   - Warenausgang aktualisieren
DELETE /warenausgaenge/{id}   - Warenausgang löschen
```

#### **HealthController** (`/health`)
```
GET    /health                - Health Check
```

### Middleware Stack

1. **CORS** - Erlaubt Requests von React Native App
2. **JWT Authentication** - Token-Validierung für alle geschützten Endpoints
3. **Swagger/OpenAPI** - API-Dokumentation (nur in Development)

### Data Layer

#### **WarenbuchungDbContext**
- Entity Framework Core DbContext
- Konfiguration von:
  - Entity Relationships
  - Indexes (SKU, Username, Email)
  - Precision für Decimal-Werte
  - Seed Data (Initial Products & Users)

#### **Models**
- **User**: Benutzer-Verwaltung
- **Product**: Produkt-Katalog
- **Wareneingang**: Wareneingangs-Transaktionen
- **Warenausgang**: Warenausgangs-Transaktionen

#### **Migrations**
- Entity Framework Migrations für Schema-Versionierung
- Automatische Datenbank-Erstellung bei App-Start

---

## Datenfluss

### 1. Authentifizierungs-Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  User   │─────▶│Frontend │─────▶│ Backend │─────▶│   DB    │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
   Login            POST              Validate         Query
   Credentials      /auth/login       Password         User
                                             │
                                             ▼
                                      Generate JWT
                                             │
┌─────────┐      ┌─────────┐      ┌─────────┐
│  User   │◀─────│Frontend │◀─────│ Backend │
└─────────┘      └─────────┘      └─────────┘
   Erfolg          Store Token      JWT Token
                   in SecureStore   + User Data
```

### 2. Datenabruf-Flow (Online)

```
User → Screen → ApiService → Backend API → Database → Response → Local SQLite
```

### 3. Datenabruf-Flow (Offline)

```
User → Screen → DatabaseService → Local SQLite → Return Data
```

### 4. Datenspeicherung-Flow (Online)

```
User → Screen → ApiService → Backend API → Database → Response → Local SQLite (Update)
```

### 5. Datenspeicherung-Flow (Offline)

```
User → Screen → DatabaseService → Local SQLite (isDirty=1) → Sync Queue
```

### 6. Synchronisations-Flow

```
When Online:
  → Check Sync Queue
  → Get all records with isDirty=1
  → Batch Upload to Backend
  → Backend saves to Database
  → Mark records as isDirty=0
  → Clear Sync Queue
```

---

## API-Endpoints

### Authentication
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/auth/login` | Benutzer-Login |
| POST | `/auth/register` | Benutzer-Registrierung |
| GET | `/auth/me` | Aktueller Benutzer (Authentifiziert) |

### Products
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/products` | Alle Produkte abrufen |
| GET | `/products/{id}` | Einzelnes Produkt abrufen |
| GET | `/products/search?query={query}` | Produkte suchen |
| POST | `/products` | Neues Produkt erstellen |
| PUT | `/products/{id}` | Produkt aktualisieren |
| DELETE | `/products/{id}` | Produkt löschen |

### Wareneingaenge
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/wareneingaenge` | Alle Wareneingaenge abrufen |
| GET | `/wareneingaenge/{id}` | Einzelnen Wareneingang abrufen |
| POST | `/wareneingaenge` | Neuen Wareneingang erstellen |
| PUT | `/wareneingaenge/{id}` | Wareneingang aktualisieren |
| DELETE | `/wareneingaenge/{id}` | Wareneingang löschen |

### Warenausgaenge
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/warenausgaenge` | Alle Warenausgaenge abrufen |
| GET | `/warenausgaenge/{id}` | Einzelnen Warenausgang abrufen |
| POST | `/warenausgaenge` | Neuen Warenausgang erstellen |
| PUT | `/warenausgaenge/{id}` | Warenausgang aktualisieren |
| DELETE | `/warenausgaenge/{id}` | Warenausgang löschen |

### Health
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/health` | Health Check (keine Auth erforderlich) |

---

## Technologie-Stack

### Frontend
- **Framework**: React Native 0.81.5
- **Plattform**: Expo 54.0.21
- **Sprache**: TypeScript 5.9.2
- **Navigation**: React Navigation 7.x
- **UI**: React Native Paper 5.14.5
- **HTTP**: Axios 1.12.2
- **Storage**: Expo SQLite, Expo Secure Store
- **Features**: Barcode Scanner, Camera

### Backend
- **Framework**: ASP.NET Core 8.0
- **Sprache**: C#
- **ORM**: Entity Framework Core 9.0.9
- **Database**: SQLite
- **Authentication**: JWT Bearer Tokens
- **Password Hashing**: BCrypt.Net
- **API Docs**: Swagger/OpenAPI

---

## Deployment

### Backend
- **Plattform**: Railway / Docker
- **Database**: SQLite (persistent volume in Production)
- **Environment**: Development, Production

### Frontend
- **Build**: EAS Build (Expo Application Services)
- **Distribution**: App Store (iOS), Google Play Store (Android)
- **Platforms**: iOS, Android, Web (optional)

---

## Sicherheit

- **JWT Tokens**: Sichere Token-basierte Authentifizierung
- **Password Hashing**: BCrypt mit Salt
- **Secure Storage**: Expo Secure Store für sensible Daten
- **HTTPS**: In Production aktiviert
- **CORS**: Konfiguriert für React Native App

---

*Erstellt: 2025*
*Version: 1.0*























