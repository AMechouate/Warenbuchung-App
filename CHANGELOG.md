# Änderungsprotokoll - Warenbuchung App

## Zusammenfassung der Änderungen seit letztem Mittwoch

### 1. Backend-Start und Konfiguration
- **Backend erfolgreich gestartet** (ASP.NET Core 8.0)
- **API-Endpunkte verifiziert** (`/api/health`, Swagger UI)
- **Backend auf Port 5232** konfiguriert

---

### 2. Frontend UI - MainScreen (Header-Bereich)

#### 2.1. Begrüßungs-Circle
- **Hinzufügung eines runden Begrüßungs-Elements** im Header
  - Text "Hallo !" über dem Benutzernamen
  - Kreis mit blauem Hintergrund und weißem Text
  - Position leicht nach unten verschoben
- **Navigation implementiert**: Klick auf Circle navigiert zum Profile Screen
- **Responsive Design**: Circle passt sich an verschiedene Bildschirmgrößen an

---

### 3. Frontend UI - WareneingaengeScreen

#### 3.1. Sticky Search/Filter/Add Bar
- **Neue sticky Zeile hinzugefügt** zwischen Header und Body
  - Suchfeld für Artikel
  - Filter-Button
  - "+" Button zum Hinzufügen neuer Artikel
- **Sticky-Verhalten**: Bleibt beim Scrollen oben sichtbar
- **Funktionalität**: Suchfeld filtert Artikel-Liste in Echtzeit

#### 3.2. Delete Button Anpassungen
- **Entfernung des "+" Buttons** aus dem Body-Bereich (da jetzt oben in sticky Bar)
- **Delete Button Icon geändert**: Rotes "X" Icon statt Standard-Delete-Icon
- **Lösch-Bestätigung**: Zeigt Artikelname statt "Artikel 1", "Artikel 2", etc.

#### 3.3. Artikel-Anzeige
- **Dynamische Titel-Anzeige**: Zeigt Artikelname statt "Artikel 1", "Artikel 2"
- **Kontextuelle Anzeige**: Name wird sowohl in der Item-Liste als auch in Lösch-Bestätigungen angezeigt

#### 3.4. Filter-Funktionalität
- **Filter-Button implementiert** (ähnlich wie in WarenausgaengeScreen)
- **Filter-Optionen hinzugefügt**:
  - Material
  - Geräte
  - Filter 3
  - Filter 4
- **Filter-Logik**: Filtert Artikel-Liste nach ausgewählten Kriterien

#### 3.5. Einheit Dropdown Fix
- **Problem behoben**: Dropdown öffnete sich nur einmal
- **Lösung**: State-Management mit `setTimeout` für zuverlässiges Öffnen/Schließen

#### 3.6. Lieferant Auto-Fill und Dropdown
- **Automatisches Ausfüllen**: Wenn nur ein Lieferant für eine Referenz existiert, wird Feld automatisch gefüllt
- **Dropdown bei mehreren Lieferanten**: Dialog mit Radio-Buttons zur Auswahl (ähnlich wie Lagerort)
- **Styling angepasst**: Dropdown sieht jetzt genau wie Lagerort-Dropdown aus

#### 3.7. Duplikat-Prävention
- **Feature**: Gleicher Artikel kann nicht zweimal in der Liste ausgewählt werden
- **Implementierung**: Bereits ausgewählte Artikel werden aus der Produktauswahl-Liste entfernt
- **User Experience**: Verhindert versehentliche Duplikate

#### 3.8. History Grouping
- **Gruppierung nach Bestellung**: Alle Artikel einer Bestellung werden in einer Karte angezeigt
- **Referenz als Titel**: Bestellnummer wird als Titel der gruppierten Karte angezeigt
- **Chronologische Sortierung**: Neueste zuerst

#### 3.9. Referenz Field Reset
- **Automatisches Zurücksetzen**: Nach erfolgreichem "Artikel buchen" wird Referenz-Feld auf null gesetzt
- **User Experience**: Bereit für neue Eingabe ohne manuelles Löschen

---

### 4. Backend und Database Anpassungen

#### 4.1. Datenbank-Modelle
- **Order Model**: Bestellungen mit Referenznummer
- **Supplier Model**: Lieferanten-Informationen
- **OrderSupplier Model**: Many-to-Many Beziehung zwischen Bestellungen und Lieferanten

#### 4.2. DTOs
- **OrderDto**: Datenübertragung für Bestellungen
- **CreateOrderDto**: Erstellung neuer Bestellungen
- **UpdateOrderDto**: Aktualisierung von Bestellungen
- **SupplierDto**: Lieferanten-Datenübertragung

#### 4.3. API Controller
- **OrdersController**: CRUD-Operationen für Bestellungen
- **SuppliersController**: CRUD-Operationen für Lieferanten
- **WareneingaengeController**: Erweiterte Funktionalität für Wareneingänge

#### 4.4. Database Migration
- **Migration erstellt**: Neue Tabellen für Orders, Suppliers, OrderSuppliers
- **Migration angewendet**: Datenbank-Schema aktualisiert

---

### 5. Frontend UI - WarenausgaengeScreen

#### 5.1. Projekt Navigation wiederhergestellt
- **Warenausgangstyp "Projekt"**: Funktionalität wiederhergestellt
- **Projektnummer-Eingabe**: Benutzer kann Projektnummer eingeben
- **Navigation zu ProjectMaterialsScreen**: Zeigt alle Materialien und Geräte des Projekts

#### 5.2. Bedingte Felder
- **Artikelnummer und Anzahl entfernt**: Bei Warenausgangstyp "Projekt" werden diese Felder nicht angezeigt
- **Lagerort-Logik angepasst**: Ähnlich wie in WareneingaengeScreen
  - Dropdown bei mehreren Lagerorten
  - Disabled TextInput bei einem Lagerort
  - Editiertbar wenn kein Lagerort zugewiesen

#### 5.3. API Integration
- **Reasons von API laden**: Ausgangsgründe werden vom Backend geladen
- **Justification Templates von API laden**: Begründungsvorlagen werden vom Backend geladen

---

### 6. Admin Settings Feature

#### 6.1. Backend Implementation
- **User Model erweitert**: `IsAdmin` Property hinzugefügt
- **WarenausgangReason Model**: Neue Entität für Ausgangsgründe
  - Id, Name, OrderIndex, IsActive, CreatedAt, UpdatedAt
- **JustificationTemplate Model**: Neue Entität für Begründungsvorlagen
  - Id, Text, OrderIndex, IsActive, CreatedAt, UpdatedAt
- **SettingsController**: Neuer Controller für Admin-Einstellungen
  - User Management (CRUD)
  - Reasons Management (CRUD)
  - Justification Templates Management (CRUD)
- **Authorization**: Admin-only Endpunkte für Verwaltungsfunktionen
- **Public Endpoints**: Öffentliche Endpunkte für aktive Reasons/Justifications

#### 6.2. Frontend Implementation
- **SettingsScreen**: Neuer Screen für Admin-Einstellungen
  - Drei Tabs: "Benutzer", "Ausgangsgründe", "Begründungsvorlagen"
  - CRUD-Funktionalität für alle Bereiche
  - Modals für Create/Edit-Operationen
- **API Service erweitert**: Neue Methoden für Settings-Management
- **TypeScript Types**: Neue Interfaces für Settings-DTOs

#### 6.3. Navigation
- **Settings Tab**: Nur für Admin-User sichtbar
- **Profile Tab**: Aus Tab-Navigator entfernt, nur über Header-Circle zugänglich
- **Bedingte Tab-Sichtbarkeit**: Normale User sehen nur "Wareneingang" und "Warenausgang"

---

### 7. Tab Navigation Anpassungen

#### 7.1. Tab-Bar Konfiguration
- **Profile Tab entfernt**: Komplett aus Tab-Navigator entfernt (nicht nur versteckt)
- **Profile als Stack Screen**: Zugriff nur über Header-Circle
- **Settings Tab**: Nur für Admin-User sichtbar
- **Tab-Bar Styling**: Leerer Platz unten entfernt
  - Platform-spezifische Höhen (iOS: 85px, Android: 60px)
  - Safe Area Insets angepasst

#### 7.2. Navigation Flow
- **Header Circle**: Navigiert immer zu Profile Screen
- **Profile Screen**: Eigenständiger Stack Screen mit Back-Button
- **Tab-Bar**: Zeigt nur relevante Tabs je nach User-Rolle

---

### 8. Profile Screen Anpassungen

#### 8.1. Header
- **Appbar.Header hinzugefügt**: Eigenständiger Header mit Back-Button
- **Navigation**: Zurück-Navigation zum vorherigen Screen

#### 8.2. Card Styling
- **Einheitliches Styling**: Karten im gleichen Stil wie WareneingaengeScreen
- **Elevation angepasst**: `elevation: 1` (wie wareneingangCard)
- **Margin angepasst**: `marginBottom: 12` (wie wareneingangCard)
- **Schatten entfernt**: Alle Shadow-Properties auf 0 gesetzt

---

### 9. Bug Fixes

#### 9.1. Frontend
- **VirtualizedLists Error**: Fixed in SettingsScreen (ScrollView zu View geändert)
- **404 Error bei Reasons**: Fixed durch öffentliche Endpunkte
- **Tab Visibility Issues**: Fixed durch korrekte Tab-Bar-Button-Konfiguration
- **Text Rendering Error**: Fixed in WareneingaengeScreen (Text in Text-Komponenten)
- **Unit Dropdown**: Fixed State-Management für zuverlässiges Öffnen

#### 9.2. Backend
- **Authorization**: Public Endpoints für Reasons/Justifications hinzugefügt
- **Database Migration**: Erfolgreich angewendet
- **Seed Data**: Admin-User und initiale Daten hinzugefügt

---

### 10. Code-Qualität und Wartbarkeit

#### 10.1. TypeScript
- **Type Definitions erweitert**: Neue Interfaces für Settings, Reasons, Justifications
- **Navigation Types**: RootStackParamList und MainTabParamList aktualisiert

#### 10.2. Code-Organisation
- **Konsistente Styling**: Card-Styles über Screens hinweg vereinheitlicht
- **Wiederverwendbare Komponenten**: Dropdown-Logik für Lagerort/Lieferant
- **State Management**: Verbessertes State-Management für Modals und Dropdowns

---

## Technische Details

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: SQLite
- **ORM**: Entity Framework Core
- **Authentication**: JWT
- **API**: RESTful mit Swagger/OpenAPI

### Frontend
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **UI Library**: React Native Paper
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **API Communication**: Axios

---

## Zusammenfassung der Features

### Neue Features
1. ✅ Sticky Search/Filter/Add Bar in WareneingaengeScreen
2. ✅ Lieferant Auto-Fill und Dropdown
3. ✅ Duplikat-Prävention bei Produktauswahl
4. ✅ History Grouping nach Bestellungen
5. ✅ Admin Settings Screen (User, Reasons, Justifications Management)
6. ✅ Bedingte Tab-Sichtbarkeit basierend auf User-Rolle
7. ✅ Profile Screen als eigenständiger Stack Screen

### Verbesserte Features
1. ✅ Filter-Funktionalität erweitert (4 Filter-Optionen)
2. ✅ Einheitliches Card-Styling über alle Screens
3. ✅ Verbesserte Navigation (Header Circle, Tab-Bar)
4. ✅ Bessere User Experience (Auto-Fill, Reset, Gruppierung)

### Bug Fixes
1. ✅ Unit Dropdown öffnet sich zuverlässig
2. ✅ VirtualizedLists Error behoben
3. ✅ 404 Errors bei API-Calls behoben
4. ✅ Tab Visibility Issues behoben
5. ✅ Text Rendering Errors behoben

---

## Datenbank-Änderungen

### Neue Tabellen
- `Orders`: Bestellungen mit Referenznummer
- `Suppliers`: Lieferanten
- `OrderSuppliers`: Many-to-Many Beziehung
- `WarenausgangReasons`: Ausgangsgründe
- `JustificationTemplates`: Begründungsvorlagen

### Erweiterte Tabellen
- `Users`: `IsAdmin` Property hinzugefügt

### Seed Data
- Admin-User mit `IsAdmin = true`
- Initiale Ausgangsgründe
- Initiale Begründungsvorlagen

---

## API-Endpunkte

### Neue Endpunkte
- `GET /api/orders` - Alle Bestellungen
- `POST /api/orders` - Neue Bestellung erstellen
- `GET /api/suppliers` - Alle Lieferanten
- `GET /api/settings/users` - User Management (Admin)
- `GET /api/settings/reasons` - Öffentliche Ausgangsgründe
- `GET /api/settings/reasons/all` - Alle Ausgangsgründe (Admin)
- `GET /api/settings/justifications` - Öffentliche Begründungsvorlagen
- `GET /api/settings/justifications/all` - Alle Begründungsvorlagen (Admin)

---

## Nächste Schritte (Optional)

1. **Testing**: Unit Tests für neue Features
2. **Documentation**: API-Dokumentation erweitern
3. **Performance**: Optimierung bei großen Datenmengen
4. **Offline Support**: Erweiterte Offline-Funktionalität
5. **Error Handling**: Verbesserte Fehlerbehandlung

---

**Erstellt am**: $(date)
**Letzte Aktualisierung**: Heute























