# 🏗️ Warenbuchung App - Production Architektur

## 📋 Übersicht

Diese Architektur beschreibt die vollständige Production-Implementierung mit:
- ✅ Offline-First Funktionalität
- ✅ Verschlüsselte lokale Datenbank
- ✅ Automatische Synchronisation
- ✅ API-Spiegelung zu Kunden-API
- ✅ Android APK Deployment
- ✅ Optimierte Datenübertragung

---

## 🎯 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANDROID APP (React Native)                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    UI Layer (Screens)                              │  │
│  │  • LoginScreen  • MainScreen  • ProductsScreen  • etc.            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Service Layer                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │ ApiService   │  │ SyncService  │  │ EncryptionService    │   │  │
│  │  │              │  │              │  │                      │   │  │
│  │  │ • HTTP Calls │  │ • Sync Logic │  │ • DB Encryption      │   │  │
│  │  │ • JWT Auth   │  │ • Conflict   │  │ • Key Management     │   │  │
│  │  │ • Retry      │  │   Resolution │  │ • Secure Storage     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Encrypted SQLite Database                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │ Products     │  │ Wareneingaenge│  │ Sync Queue           │   │  │
│  │  │ Warenausgaenge│ │ Users        │  │ • Pending Changes    │   │  │
│  │  │ Orders       │  │ Settings     │  │ • Sync Metadata      │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │  │
│  │                                                                   │  │
│  │  🔒 Encryption: SQLCipher (AES-256)                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Network Layer                                        │  │
│  │  • Connection Monitoring                                         │  │
│  │  • Auto-Sync on Reconnect                                        │  │
│  │  • Background Sync Service                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (ASP.NET Core)                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    API Controllers                                 │  │
│  │  • /auth          • /products    • /wareneingaenge                │  │
│  │  • /warenausgaenge • /orders     • /sync                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                                  │  │
│  │  • Validation    • Authorization  • Data Transformation          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Data Access Layer                                     │  │
│  │  • Entity Framework Core  • SQLite Database                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Sync & Mirror Service                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │ SyncManager  │  │ MirrorService│  │ ConflictResolver     │   │  │
│  │  │              │  │              │  │                      │   │  │
│  │  │ • Batch Sync │  │ • API Mirror │  │ • Last-Write-Wins    │   │  │
│  │  │ • Delta Sync │  │ • Data Map   │  │ • Merge Strategy     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + API Key
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    KUNDEN-API (External)                                 │
│  • ERP System                                                            │
│  • Warehouse Management                                                  │
│  • Production System                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sicherheits-Architektur

### 1. Lokale Datenbank-Verschlüsselung

**Technologie:** SQLCipher (AES-256)

```typescript
// Encryption Service
class EncryptionService {
  private encryptionKey: string;
  
  // Key wird aus Device Keychain/Keystore generiert
  async initializeEncryption(): Promise<void> {
    const deviceId = await getDeviceId();
    const userToken = await SecureStore.getItemAsync('auth_token');
    this.encryptionKey = await generateKey(deviceId, userToken);
  }
  
  // SQLite Database mit SQLCipher öffnen
  async openEncryptedDatabase(): Promise<SQLiteDatabase> {
    return SQLite.openDatabaseAsync('warenbuchung.db', {
      enableChangeListener: true,
      encryptionKey: this.encryptionKey
    });
  }
}
```

**Verschlüsselte Daten:**
- Alle Tabellen-Daten
- Sync Queue
- Lokale Benutzerdaten
- Temporäre Cache-Daten

**Nicht verschlüsselt (Performance):**
- Indizes
- Metadaten (Tabellennamen, Spaltennamen)

### 2. Netzwerk-Sicherheit

- **HTTPS Only:** Alle API-Calls über HTTPS
- **Certificate Pinning:** Für Production-Server
- **JWT Tokens:** In SecureStore verschlüsselt gespeichert
- **Token Refresh:** Automatische Token-Erneuerung

### 3. API-Spiegelung Sicherheit

- **API Key Management:** Kunden-API Keys in Backend gespeichert
- **Rate Limiting:** Schutz vor API-Überlastung
- **Data Validation:** Validierung vor Spiegelung
- **Error Handling:** Graceful Degradation bei API-Fehlern

---

## 🔄 Synchronisations-Architektur

### 1. Sync-Strategien

#### **Delta-Sync (Empfohlen)**
```typescript
interface SyncRequest {
  lastSyncTimestamp: string;
  deviceId: string;
  pendingChanges: PendingChange[];
}

interface SyncResponse {
  updates: EntityUpdate[];
  conflicts: Conflict[];
  serverTimestamp: string;
}
```

**Vorteile:**
- Minimale Datenübertragung
- Schnelle Synchronisation
- Reduzierte Server-Last

#### **Full-Sync (Fallback)**
- Bei erster Installation
- Nach langer Offline-Zeit (> 7 Tage)
- Bei Datenbank-Fehlern

### 2. Sync-Flow

```
App Start
    │
    ▼
Check Internet Connection
    │
    ├─► Online ──► Full Sync (if first time)
    │              │
    │              ▼
    │         Delta Sync (if lastSync exists)
    │              │
    │              ▼
    │         Upload Pending Changes
    │              │
    │              ▼
    │         Resolve Conflicts
    │              │
    │              ▼
    │         Update Local DB
    │              │
    │              ▼
    │         Mirror to Customer API
    │
    └─► Offline ──► Load from Local DB
                    │
                    ▼
               Show Offline Indicator
```

### 3. Konfliktlösung

**Strategien:**

1. **Last-Write-Wins (Standard)**
   - Neueste Timestamp gewinnt
   - Für: Produkte, Bestände

2. **Merge Strategy**
   - Kombiniert Änderungen
   - Für: Bestandsänderungen (Addition)

3. **User Resolution**
   - Benutzer wählt manuell
   - Für: Kritische Daten

```typescript
interface Conflict {
  entityType: string;
  entityId: number;
  localVersion: Entity;
  serverVersion: Entity;
  resolution: 'local' | 'server' | 'merge' | 'manual';
}
```

### 4. Sync Queue Management

```typescript
interface SyncQueueItem {
  id: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: number;
  data: string; // JSON
  timestamp: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
}
```

**Features:**
- Automatische Retry-Logik
- Priorisierung (kritische Daten zuerst)
- Batch-Upload (mehrere Items gleichzeitig)
- Fehlerbehandlung mit Exponential Backoff

---

## 🔗 API-Spiegelungs-Architektur

### 1. Spiegelungs-Konzept

**Zweck:** Synchronisation zwischen unserer Datenbank und Kunden-API

```
Unsere DB ──► Mirror Service ──► Kunden-API
                │
                ▼
         Mapping & Transformation
                │
                ▼
         Error Handling & Retry
```

### 2. Daten-Mapping

```typescript
interface DataMapping {
  // Unsere Entitäten → Kunden-API Format
  product: {
    ourField: 'name',
    customerField: 'productName',
    transform: (value: string) => value.toUpperCase()
  },
  wareneingang: {
    ourField: 'quantity',
    customerField: 'receivedQuantity',
    transform: (value: number) => value
  }
}
```

### 3. Spiegelungs-Strategien

#### **Real-Time Mirroring**
- Sofortige Synchronisation bei Änderungen
- Für: Kritische Transaktionen

#### **Batch Mirroring**
- Periodische Synchronisation (z.B. alle 15 Minuten)
- Für: Große Datenmengen

#### **Event-Driven Mirroring**
- Trigger-basiert bei bestimmten Events
- Für: Bestimmte Business-Logik

### 4. Mirror Service Implementation

```csharp
// Backend: MirrorService.cs
public class MirrorService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    
    public async Task MirrorToCustomerApi<T>(T entity, string entityType)
    {
        try
        {
            var mappedData = MapToCustomerFormat(entity, entityType);
            var response = await _httpClient.PostAsync(
                $"{_configuration["CustomerApi:BaseUrl"]}/api/{entityType}",
                new StringContent(JsonSerializer.Serialize(mappedData))
            );
            
            if (!response.IsSuccessStatusCode)
            {
                // Queue for retry
                await QueueForRetry(entity, entityType);
            }
        }
        catch (Exception ex)
        {
            // Log error and queue for retry
            _logger.LogError(ex, "Mirroring failed");
            await QueueForRetry(entity, entityType);
        }
    }
}
```

---

## 📱 Android APK Build

### 1. Build-Konfiguration

**EAS Build (Expo Application Services)**

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "API_BASE_URL": "https://api.warenbuchung.de/api"
      }
    },
    "development": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "API_BASE_URL": "http://192.168.8.131:5232/api"
      }
    }
  }
}
```

### 2. App-Konfiguration

```json
// app.json
{
  "expo": {
    "name": "Warenbuchung App",
    "slug": "warenbuchung-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "android": {
      "package": "de.optimi.warenbuchung",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### 3. Build-Prozess

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure project
eas build:configure

# 4. Build APK
eas build --platform android --profile production

# 5. Download APK
# APK wird in EAS Dashboard verfügbar sein
```

---

## 🚀 App-Start Flow

### 1. Initialisierung

```typescript
// App.tsx
useEffect(() => {
  const initializeApp = async () => {
    // 1. Initialize Encryption
    await encryptionService.initialize();
    
    // 2. Open Encrypted Database
    await databaseService.init();
    
    // 3. Check Authentication
    const isAuthenticated = await apiService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Show Login Screen
      return;
    }
    
    // 4. Check Internet Connection
    const isOnline = await checkInternetConnection();
    
    if (isOnline) {
      // 5. Sync Data
      await syncService.fullSync();
      
      // 6. Mirror to Customer API
      await mirrorService.syncPendingMirrors();
    } else {
      // Load from Local DB
      await loadLocalData();
    }
    
    // 7. Setup Background Sync
    setupBackgroundSync();
  };
  
  initializeApp();
}, []);
```

### 2. Datenaktualisierung beim Start

```typescript
class SyncService {
  async fullSync(): Promise<void> {
    try {
      // 1. Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();
      
      // 2. Request updates from server
      const updates = await apiService.sync({
        lastSyncTimestamp: lastSync,
        deviceId: await getDeviceId()
      });
      
      // 3. Apply updates to local DB
      for (const update of updates.entities) {
        await databaseService.save(update, false); // isDirty = false
      }
      
      // 4. Upload pending changes
      await this.uploadPendingChanges();
      
      // 5. Resolve conflicts
      await this.resolveConflicts(updates.conflicts);
      
      // 6. Update sync timestamp
      await this.updateLastSyncTimestamp(updates.serverTimestamp);
      
    } catch (error) {
      console.error('Sync failed:', error);
      // Fallback to local data
    }
  }
}
```

---

## 📊 Datenfluss-Diagramme

### 1. Offline → Online Synchronisation

```
User Action (Offline)
    │
    ▼
Save to Local DB (isDirty=1)
    │
    ▼
Add to Sync Queue
    │
    ▼
[User continues working offline]
    │
    ▼
Internet Connection Restored
    │
    ▼
Background Sync Service Detects Connection
    │
    ▼
Process Sync Queue
    │
    ├─► Upload to Our Backend
    │       │
    │       ▼
    │   Success → Mark as Synced (isDirty=0)
    │       │
    │       ▼
    │   Mirror to Customer API
    │       │
    │       ▼
    │   Success → Mark Mirror as Complete
    │
    └─► Error → Retry Later (Exponential Backoff)
```

### 2. API-Spiegelungs-Flow

```
Backend receives Update
    │
    ▼
Save to Our Database
    │
    ▼
Queue for Mirroring
    │
    ▼
Transform Data (Our Format → Customer Format)
    │
    ▼
Call Customer API
    │
    ├─► Success → Mark as Mirrored
    │
    └─► Error → Retry Queue
            │
            ▼
        Exponential Backoff
            │
            ▼
        Retry (max 3 attempts)
            │
            ├─► Success → Mark as Mirrored
            │
            └─► Failed → Alert Admin
```

---

## 🛠️ Implementierungs-Schritte

### Phase 1: Verschlüsselung
1. ✅ SQLCipher Integration
2. ✅ Encryption Service
3. ✅ Key Management
4. ✅ Migration bestehender Datenbanken

### Phase 2: Synchronisation
1. ✅ Sync Service
2. ✅ Delta-Sync Implementation
3. ✅ Conflict Resolution
4. ✅ Background Sync

### Phase 3: API-Spiegelung
1. ✅ Mirror Service Backend
2. ✅ Data Mapping
3. ✅ Error Handling
4. ✅ Retry Logic

### Phase 4: Android Build
1. ✅ EAS Configuration
2. ✅ APK Build
3. ✅ Testing
4. ✅ Distribution

---

## 📈 Performance-Optimierungen

### 1. Datenübertragung
- **Compression:** GZIP für API-Responses
- **Batch Operations:** Mehrere Entities in einem Request
- **Delta Sync:** Nur geänderte Daten übertragen
- **Pagination:** Große Datensätze seitenweise laden

### 2. Lokale Datenbank
- **Indizes:** Auf häufig abgefragten Spalten
- **Connection Pooling:** Wiederverwendung von DB-Connections
- **Lazy Loading:** Daten nur bei Bedarf laden
- **Caching:** Häufig genutzte Daten im Memory Cache

### 3. Synchronisation
- **Background Processing:** Sync im Hintergrund
- **Priorisierung:** Wichtige Daten zuerst
- **Throttling:** Max. Requests pro Sekunde
- **Debouncing:** Mehrere Änderungen zusammenfassen

---

## 🔍 Monitoring & Logging

### 1. App-Logging
```typescript
class Logger {
  logSyncEvent(event: SyncEvent): void {
    // Log to local file
    // Upload to server when online
  }
  
  logError(error: Error, context: string): void {
    // Log with stack trace
    // Send to error tracking service
  }
}
```

### 2. Backend-Monitoring
- **Sync Statistics:** Anzahl Syncs, Erfolgsrate
- **API Mirror Status:** Erfolgreiche/Fehlgeschlagene Spiegelungen
- **Performance Metrics:** Response Times, Throughput
- **Error Tracking:** Fehlerhäufigkeit, Patterns

---

## 🧪 Testing-Strategie

### 1. Unit Tests
- Encryption Service
- Sync Logic
- Data Mapping
- Conflict Resolution

### 2. Integration Tests
- API Communication
- Database Operations
- Sync Flow
- Mirror Service

### 3. E2E Tests
- Complete Sync Flow
- Offline → Online Transition
- Conflict Resolution
- API Mirroring

---

## 📝 Nächste Schritte

1. **Verschlüsselung implementieren**
2. **Sync Service erweitern**
3. **API-Spiegelung entwickeln**
4. **Android Build konfigurieren**
5. **Testing & Deployment**

---

*Erstellt: 2025-01-21*
*Version: 1.0*




