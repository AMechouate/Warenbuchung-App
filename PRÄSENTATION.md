# 📱 Warenbuchung-App Präsentation

## 🎯 Projektübersicht

**Warenbuchung-App** - Eine moderne Mobile App für die Verwaltung von Wareneingängen und -ausgängen

---

## 🏗️ System-Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📱 Frontend   │    │   🔧 Backend    │    │   🗄️ Database   │
│                 │    │                 │    │                 │
│ React Native    │◄──►│ ASP.NET Core    │◄──►│ SQLite         │
│ Expo            │    │ Web API         │    │ Entity Framework│
│ TypeScript      │    │ JWT Auth        │    │                 │
│                 │    │ Swagger UI      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Komponenten:**
- **Frontend:** React Native mit Expo (iOS & Android)
- **Backend:** ASP.NET Core Web API (.NET 8)
- **Database:** SQLite mit Entity Framework Core
- **Authentication:** JWT Token-basiert
- **API Documentation:** Swagger UI

---

## 🗄️ Datenbank-Schema

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ Id (PK)         │
│ Username        │
│ Email           │
│ PasswordHash    │
│ FirstName       │
│ LastName        │
│ IsActive        │
│ CreatedAt       │
│ LastLoginAt     │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    Products     │
├─────────────────┤
│ Id (PK)         │
│ Name            │
│ Description     │
│ SKU             │
│ Price           │
│ StockQuantity   │
│ Unit            │
│ CreatedAt       │
│ UpdatedAt       │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Wareneingaenge  │    │ Warenausgaenge  │
├─────────────────┤    ├─────────────────┤
│ Id (PK)         │    │ Id (PK)         │
│ ProductId (FK)  │    │ ProductId (FK)  │
│ Quantity        │    │ Quantity        │
│ UnitPrice       │    │ UnitPrice       │
│ TotalPrice      │    │ TotalPrice      │
│ Supplier        │    │ Customer        │
│ BatchNumber     │    │ OrderNumber     │
│ ExpiryDate      │    │ Notes           │
│ Notes           │    │ CreatedAt       │
│ CreatedAt       │    │ UpdatedAt       │
│ UpdatedAt       │    │                 │
└─────────────────┘    └─────────────────┘
```

---

## 🔐 Authentifizierung-Flow

```
1. Login Request
   ┌─────────────┐
   │   Username  │
   │   Password  │
   └─────────────┘
           │
           ▼
2. Backend Validation
   ┌─────────────┐
   │ Check User  │
   │ Verify Hash │
   └─────────────┘
           │
           ▼
3. JWT Token Generation
   ┌─────────────┐
   │ Create JWT  │
   │ Set Expiry  │
   └─────────────┘
           │
           ▼
4. Token Response
   ┌─────────────┐
   │ JWT Token   │
   │ User Data   │
   └─────────────┘
           │
           ▼
5. Store Token (SecureStore)
   ┌─────────────┐
   │ Local       │
   │ Storage     │
   └─────────────┘
```

---

## 📱 Frontend-Komponenten

```
┌─────────────────────────────────────────┐
│              App.tsx                    │
│         (Navigation Root)               │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Login   │ │ Main    │ │ Profile │
│ Screen  │ │ Screen  │ │ Screen  │
└─────────┘ └─────────┘ └─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Products │ │Warenein│ │Warenaus │
│Screen   │ │Screen   │ │Screen   │
└─────────┘ └─────────┘ └─────────┘
```

### **Services:**
- **API Service:** Axios-basierte HTTP-Client
- **Database Service:** SQLite für Offline-Daten
- **Auth Service:** JWT Token Management

---

## 🔌 API-Endpoints

```
┌─────────────────────────────────────────┐
│              API Routes                 │
├─────────────────────────────────────────┤
│ POST   /api/auth/login                  │
│ POST   /api/auth/register               │
│                                        │
│ GET    /api/products                    │
│ POST   /api/products                    │
│ PUT    /api/products/{id}               │
│ DELETE /api/products/{id}               │
│                                        │
│ GET    /api/wareneingaenge              │
│ POST   /api/wareneingaenge              │
│ PUT    /api/wareneingaenge/{id}         │
│ DELETE /api/wareneingaenge/{id}         │
│                                        │
│ GET    /api/warenausgaenge              │
│ POST   /api/warenausgaenge              │
│ PUT    /api/warenausgaenge/{id}         │
│ DELETE /api/warenausgaenge/{id}         │
└─────────────────────────────────────────┘
```

---

## 🚀 Projekt-Entwicklung (Schritt-für-Schritt)

### **Phase 1: Backend Setup**
1. **ASP.NET Core Projekt erstellen**
   ```bash
   dotnet new webapi -n WarenbuchungApi
   ```

2. **Entity Framework Setup**
   ```bash
   dotnet add package Microsoft.EntityFrameworkCore.Sqlite
   dotnet add package Microsoft.EntityFrameworkCore.Design
   ```

3. **JWT Authentication**
   ```bash
   dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
   ```

4. **Swagger Documentation**
   ```bash
   dotnet add package Swashbuckle.AspNetCore
   ```

### **Phase 2: Datenmodell**
1. **Models erstellen:** User, Product, Wareneingang, Warenausgang
2. **DbContext konfigurieren**
3. **Migrations erstellen:** `dotnet ef migrations add InitialCreate`
4. **Database erstellen:** `dotnet ef database update`

### **Phase 3: API Controller**
1. **AuthController:** Login/Register
2. **ProductsController:** CRUD Operations
3. **WareneingaengeController:** Wareneingang Management
4. **WarenausgaengeController:** Warenausgang Management

### **Phase 4: Frontend Setup**
1. **React Native Projekt erstellen**
   ```bash
   npx create-expo-app WarenbuchungApp --template
   ```

2. **Dependencies installieren**
   ```bash
   npm install @react-navigation/native @react-navigation/stack
   npm install react-native-paper axios expo-secure-store
   ```

3. **Navigation Setup**
4. **API Service erstellen**
5. **Screens entwickeln**

### **Phase 5: Testing & Deployment**
1. **Backend Testing:** Swagger UI
2. **Frontend Testing:** Expo Go App
3. **Cross-Platform Testing:** iOS & Android
4. **Production Deployment:** Docker + Server

---

## 💼 Business Value

### **Vorteile:**
- ✅ **Cross-Platform:** Ein Code für iOS & Android
- ✅ **Offline-Fähig:** SQLite für lokale Daten
- ✅ **Sicher:** JWT Authentication
- ✅ **Skalierbar:** RESTful API Architecture
- ✅ **Wartbar:** Moderne Tech-Stack
- ✅ **Dokumentiert:** Swagger API Documentation

### **Features:**
- 🔐 **Benutzer-Management:** Login/Register
- 📦 **Produkt-Verwaltung:** CRUD Operations
- 📥 **Wareneingang:** Lieferungen erfassen
- 📤 **Warenausgang:** Verkäufe erfassen
- 📊 **Bestands-Verwaltung:** Automatische Updates
- 📱 **Mobile-First:** Optimiert für Smartphones

---

## 🛠️ Technologie-Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Frontend** | React Native | 0.81.4 |
| **Framework** | Expo | ~54.0.13 |
| **Language** | TypeScript | ~5.9.2 |
| **Backend** | ASP.NET Core | 8.0 |
| **Database** | SQLite | Latest |
| **ORM** | Entity Framework | Latest |
| **Auth** | JWT Bearer | Latest |
| **API Docs** | Swagger | Latest |

---

## 📈 Nächste Schritte

### **Kurzfristig:**
- [ ] **App Store Deployment**
- [ ] **Production Server Setup**
- [ ] **Domain & HTTPS**
- [ ] **Backup Strategy**

### **Langfristig:**
- [ ] **Reporting Features**
- [ ] **Barcode Scanner**
- [ ] **Multi-User Support**
- [ ] **Cloud Sync**
- [ ] **Analytics Dashboard**

---

## 🎯 Fazit

Die **Warenbuchung-App** ist eine moderne, skalierbare Lösung für die Verwaltung von Wareneingängen und -ausgängen. Mit einem robusten Backend, einer benutzerfreundlichen Mobile App und einer sicheren Authentifizierung bietet sie eine solide Grundlage für das Geschäftswachstum.

**Entwicklungszeit:** ~2 Wochen
**Technologie:** Moderne, bewährte Technologien
**Wartbarkeit:** Hoch
**Skalierbarkeit:** Sehr gut





































