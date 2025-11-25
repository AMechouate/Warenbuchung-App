# Feature-Entwicklungs-Checkliste

## 📦 WARENEINGÄNGE

### 1. Umbuchung von Lagerort nach Lagerort + Referenz
- [ ] Backend: Datenbank-Modell erweitern
  - [ ] `FromLocation` (Von Lagerort) Feld hinzufügen
  - [ ] `ToLocation` (Nach Lagerort) Feld hinzufügen
  - [ ] `Reference` (Referenz) Feld hinzufügen
  - [ ] `TransferType` (Umbuchungstyp) Enum hinzufügen
  - [ ] Migration erstellen und testen
- [ ] Backend: Controller erweitern
  - [ ] POST-Endpoint für Umbuchung erstellen
  - [ ] Validierung für Lagerort-Umbuchung implementieren
  - [ ] Lagerbestand aktualisieren (von Lagerort reduzieren, zu Lagerort erhöhen)
- [ ] Frontend: UI implementieren
  - [ ] Auswahlfeld für "Umbuchung" als Eingangstyp
  - [ ] Von Lagerort Dropdown/Input
  - [ ] Nach Lagerort Dropdown/Input (Pflichtfeld)
  - [ ] Referenz-Feld hinzufügen
  - [ ] Formular-Validierung implementieren

### 2. Referenz für Eingänge ohne Bestellung
- [ ] Backend: Datenbank-Modell
  - [ ] `Reference` Feld zu Wareneingang hinzufügen (falls nicht vorhanden)
  - [ ] `OrderNumber` als optional markieren
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] POST-Endpoint anpassen, dass Reference auch ohne Bestellung möglich ist
  - [ ] Validierung anpassen
- [ ] Frontend: UI
  - [ ] Toggle/Option "Ohne Bestellung"
  - [ ] Referenz-Feld anzeigen/verbergen basierend auf Auswahl
  - [ ] Validierung anpassen

### 3. Optische Unterscheidung der Eingangstypen
- [ ] Frontend: UI-Komponenten
  - [ ] Farbcodierung für verschiedene Eingangstypen
    - [ ] Mit Bestellung: Farbe X
    - [ ] Ohne Bestellung: Farbe Y
    - [ ] Umbuchung: Farbe Z
  - [ ] Icons für verschiedene Eingangstypen hinzufügen
  - [ ] Badge/Chip für Eingangstyp-Anzeige
- [ ] Frontend: Liste/Übersicht
  - [ ] Eingangstyp in Liste anzeigen
  - [ ] Filter nach Eingangstyp
  - [ ] Sortierung nach Eingangstyp

### 4. Bekannte/unbekannte Artikel
- [ ] Backend: Datenbank-Modell
  - [ ] `IsUnknownArticle` Flag hinzufügen
  - [ ] `TemporaryArticleName` Feld für unbekannte Artikel
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] POST-Endpoint für Wareneingang anpassen
  - [ ] Wenn Artikel nicht existiert, temporären Eintrag erstellen
  - [ ] Logik: Nach Wareneingang neuen Artikel vorschlagen/erstellen
- [ ] Frontend: UI
  - [ ] Toggle "Artikel unbekannt" / "Artikel bekannt"
  - [ ] Wenn unbekannt: Name/SKU Eingabefeld
  - [ ] Artikel-Suche deaktivieren bei unbekanntem Artikel
  - [ ] Bestätigungsdialog nach Eingang: "Artikel zur Liste hinzufügen?"

### 5. Lagerort-Umbuchung als Pflichtfeld
- [ ] Backend: Validierung
  - [ ] Server-seitige Validierung: Wenn Umbuchung, dann FromLocation und ToLocation erforderlich
  - [ ] Fehlerbehandlung
- [ ] Frontend: Validierung
  - [ ] Client-seitige Validierung
  - [ ] Fehlermeldung anzeigen wenn nicht ausgefüllt
  - [ ] Submit-Button deaktivieren wenn Pflichtfelder fehlen

### 6. Rücksendung an Lieferant
- [ ] Backend: Datenbank-Modell
  - [ ] `ReturnToSupplier` Flag hinzufügen
  - [ ] `ReturnReasonId` Foreign Key hinzufügen (siehe Punkt 19 - Rücklieferungsgründe)
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] POST-Endpoint für Rücksendung erstellen
  - [ ] Lagerbestand reduzieren bei Rücksendung
  - [ ] Validierung implementieren
- [ ] Frontend: UI
  - [ ] Button/Option "Rücksendung an Lieferant"
  - [ ] Rücklieferungsgrund auswählen (Dropdown)
  - [ ] Begründung und Bemerkung Felder (siehe Punkt 14)
  - [ ] Formular-Layout

---

## 📤 WARENAUSGÄNGE

### 7. Begründung und Bemerkung in Project-Bereich
- [ ] Frontend: UI-Restrukturierung
  - [ ] Begründung-Feld in Project-Bereich verschieben
  - [ ] Bemerkungsfeld in Project-Bereich verschieben
  - [ ] Layout anpassen
  - [ ] Komponente "Project-Section" erstellen

### 8. Referenz oberhalb von Project
- [ ] Frontend: UI-Anpassung
  - [ ] Referenz-Feld oberhalb des Project-Feldes positionieren
  - [ ] Reihenfolge der Felder anpassen
  - [ ] Layout überprüfen

### 9. Von/Nach Felder oberhalb der Artikelnummer
- [ ] Frontend: UI-Restrukturierung
  - [ ] Von-Feld oberhalb Artikelnummer verschieben
  - [ ] Nach-Feld oberhalb Artikelnummer verschieben
  - [ ] Layout anpassen
  - [ ] Responsive Design überprüfen

### 10. Ausgangsgrund entfernen
- [ ] Backend: Datenbank-Modell
  - [ ] `Ausgangsgrund` Feld entfernen (Falls vorhanden)
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] Ausgangsgrund aus DTO entfernen
  - [ ] Validierung anpassen
- [ ] Frontend: UI
  - [ ] Ausgangsgrund-Feld aus Formular entfernen
  - [ ] Code-Bereinigung

### 11. Entsorgungsgrund nur für Admins
- [ ] Backend: Datenbank-Modell
  - [ ] `DisposalReason` Tabelle erstellen (falls nicht vorhanden)
  - [ ] Foreign Key zu Warenausgang
  - [ ] Migration erstellen
- [ ] Backend: Controller CRUD für Entsorgungsgründe (nur Admin)
  - [ ] **CREATE**: POST `/api/disposal-reasons` - Nur Admin
  - [ ] **READ**: GET `/api/disposal-reasons` - Alle können lesen
  - [ ] **UPDATE**: PUT `/api/disposal-reasons/{id}` - Nur Admin
  - [ ] **DELETE**: DELETE `/api/disposal-reasons/{id}` - Nur Admin
- [ ] Backend: Authorization
  - [ ] [Authorize(Roles = "Admin")] Attribute hinzufügen
  - [ ] Rollenprüfung implementieren
- [ ] Frontend: Admin-UI für Entsorgungsgründe-Verwaltung
  - [ ] Screen für Entsorgungsgründe-Verwaltung
  - [ ] Create-Formular
  - [ ] Liste mit Edit/Delete Buttons
  - [ ] Navigation zu diesem Screen (nur für Admins)
- [ ] Frontend: User-UI für Auswahl
  - [ ] Dropdown für Entsorgungsgrund (nur Lesen)
  - [ ] Nur bei Ausgangstyp "Entsorgung" anzeigen

### 12. Begründung als Liste (verpflichtend)
- [ ] Backend: Datenbank-Modell
  - [ ] `Reason` Tabelle erstellen
    - [ ] `Id` (Primary Key)
    - [ ] `Name` (Begründungstext)
    - [ ] `Description` (Beschreibung)
    - [ ] `IsActive` (Flag)
    - [ ] `CreatedAt`, `UpdatedAt`
  - [ ] `ReasonId` Foreign Key zu Warenausgang hinzufügen
  - [ ] Migration erstellen
- [ ] Backend: Controller CRUD für Begründungsgründe (nur Admin)
  - [ ] **CREATE**: POST `/api/reasons` - Nur Admin
  - [ ] **READ**: GET `/api/reasons` - Alle können lesen
  - [ ] **UPDATE**: PUT `/api/reasons/{id}` - Nur Admin
  - [ ] **DELETE**: DELETE `/api/reasons/{id}` - Nur Admin
- [ ] Backend: Warenausgang Controller
  - [ ] POST-Endpoint: `ReasonId` als Pflichtfeld validieren
  - [ ] PUT-Endpoint: `ReasonId` validieren
  - [ ] GET-Endpoint: Reason-Information mitschicken
- [ ] Backend: Authorization
  - [ ] Admin-Rolle für CRUD-Endpoints prüfen
- [ ] Frontend: Admin-UI für Begründungsgründe-Verwaltung
  - [ ] Screen "Begründungsgründe verwalten"
  - [ ] Liste aller Gründe anzeigen
  - [ ] Create: Neuen Grund hinzufügen (Name, Beschreibung)
  - [ ] Update: Grund bearbeiten
  - [ ] Delete: Grund löschen (Soft Delete oder Hard Delete)
  - [ ] Aktiv/Inaktiv Toggle
- [ ] Frontend: User-UI - Warenausgang Formular
  - [ ] Begründung als Dropdown-Liste (verpflichtend)
  - [ ] Placeholder: "Begründung auswählen *"
  - [ ] Validierung: Fehlermeldung wenn nicht ausgewählt
  - [ ] Alle Screens mit Warenausgang aktualisieren
    - [ ] WarenausgaengeScreen.tsx
    - [ ] ProjectMaterialsScreen.tsx (falls vorhanden)

### 13. Bemerkungsfeld (Merkungsfeld)
- [ ] Backend: Datenbank-Modell
  - [ ] `Remarks` oder `Comment` Feld zu Warenausgang hinzufügen (falls nicht vorhanden)
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] DTO anpassen
  - [ ] Validierung (optional)
- [ ] Frontend: UI
  - [ ] TextInput-Feld für Bemerkungen hinzufügen
  - [ ] Multi-line TextInput
  - [ ] Platzierung: Im Project-Bereich (siehe Punkt 7)
  - [ ] Alle Warenausgang-Screens aktualisieren

### 14. Rücklieferung: Begründung und Bemerkung
- [ ] Backend: Datenbank-Modell
  - [ ] `ReturnReasonId` Foreign Key (siehe Rücklieferungsgründe)
  - [ ] `ReturnRemarks` Feld hinzufügen
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] Rücklieferungs-Endpoint anpassen
  - [ ] Validierung
- [ ] Frontend: UI
  - [ ] Rücklieferungsgrund auswählen
  - [ ] Bemerkungsfeld für Details (z.B. "passt nicht", "falsche Farbe")
  - [ ] Formular-Layout

---

## 🔄 GEMEINSAME FEATURES

### 15. Warenkorb-Prinzip
- [ ] Backend: Datenbank-Modell
  - [ ] `Transaction` oder `Shipment` Tabelle erstellen
    - [ ] `Id` (Primary Key)
    - [ ] `Type` (Wareneingang/Warenausgang)
    - [ ] `UserId` (Wer hat es erstellt)
    - [ ] `Status` (Entwurf, Abgeschlossen)
    - [ ] `CreatedAt`, `UpdatedAt`
  - [ ] `TransactionItems` Tabelle erstellen
    - [ ] `Id` (Primary Key)
    - [ ] `TransactionId` (Foreign Key)
    - [ ] `ProductId` (Foreign Key)
    - [ ] `Quantity`, `UnitPrice`, etc.
  - [ ] Relation: Warenausgang/Wareneingang hat optional TransactionId
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] POST `/api/transactions` - Neue Transaktion erstellen
  - [ ] POST `/api/transactions/{id}/items` - Artikel zu Transaktion hinzufügen
  - [ ] GET `/api/transactions/{id}` - Transaktion mit Items laden
  - [ ] PUT `/api/transactions/{id}` - Transaktion aktualisieren
  - [ ] DELETE `/api/transactions/{id}/items/{itemId}` - Item entfernen
  - [ ] POST `/api/transactions/{id}/complete` - Transaktion abschließen
- [ ] Frontend: Warenkorb-Komponente
  - [ ] Warenkorb-Button/Icon oben im Screen
  - [ ] Warenkorb-Anzeige (Badge mit Anzahl)
  - [ ] Warenkorb-Modal/Sheet
  - [ ] Artikel hinzufügen zu Warenkorb
  - [ ] Artikel aus Warenkorb entfernen
  - [ ] Anzahl ändern
  - [ ] Gesamtsumme anzeigen
- [ ] Frontend: Wareneingang-Screen
  - [ ] Warenkorb oben anzeigen
  - [ ] Artikel zum Warenkorb hinzufügen (statt sofort zu speichern)
  - [ ] "Alle buchen" Button
- [ ] Frontend: Warenausgang-Screen
  - [ ] Warenkorb oben anzeigen
  - [ ] Artikel zum Warenkorb hinzufügen
  - [ ] "Alle ausbuchen" Button

### 16. Artikelnummer-Buttons (Suchen & Scannen)
- [ ] Frontend: Artikel-Suche Button
  - [ ] Button neben Artikelnummer-Feld
  - [ ] Icon: Magnifying Glass
  - [ ] Modal mit Produktliste öffnen
  - [ ] Suchfunktion in Produktliste
  - [ ] Produkt aus Liste auswählen
  - [ ] Ausgewähltes Produkt in Formular übernehmen
- [ ] Frontend: Artikel-Scannen Button
  - [ ] Button neben Artikelnummer-Feld
  - [ ] Icon: Barcode Scanner
  - [ ] Barcode Scanner Library integrieren (z.B. expo-barcode-scanner)
  - [ ] Scanner-Modal öffnen
  - [ ] Barcode scannen
  - [ ] Produkt anhand Barcode/SKU suchen
  - [ ] Gefundenes Produkt in Formular übernehmen
  - [ ] Fehlerbehandlung wenn Produkt nicht gefunden
- [ ] Frontend: UI-Anpassung
  - [ ] Layout: Artikelnummer | [Suchen] [Scannen]
  - [ ] Beide Buttons stylen (konsistent)
  - [ ] Responsive Design
  - [ ] In beiden Screens implementieren:
    - [ ] WareneingaengeScreen.tsx
    - [ ] WarenausgaengeScreen.tsx

---

## 👤 ADMIN-FUNKTIONALITÄTEN

### 17. Admin-Passwort-Reset
- [ ] Backend: Datenbank-Modell
  - [ ] `User` Tabelle prüfen: `Role` oder `IsAdmin` Feld vorhanden?
  - [ ] Falls nicht: Hinzufügen
  - [ ] Migration erstellen
- [ ] Backend: Controller
  - [ ] PUT `/api/users/{id}/reset-password` - Passwort zurücksetzen
  - [ ] Authorization: Nur Admin kann andere Admins zurücksetzen
  - [ ] Validierung: Admin-Rolle prüfen
  - [ ] Neues Passwort generieren oder Admin setzt neues Passwort
  - [ ] Email-Benachrichtigung (optional)
- [ ] Frontend: Admin-UI
  - [ ] User-Liste mit Admin-Status anzeigen
  - [ ] "Passwort zurücksetzen" Button bei jedem User
  - [ ] Bestätigungsdialog
  - [ ] Neues Passwort setzen (Admin gibt es ein)
  - [ ] Erfolgsmeldung anzeigen

### 18. Rücklieferungsgründe-Verwaltung (Admin)
- [ ] Backend: Datenbank-Modell
  - [ ] `ReturnReason` Tabelle erstellen
    - [ ] `Id` (Primary Key)
    - [ ] `Name` (Grund-Name)
    - [ ] `Description` (Beschreibung)
    - [ ] `IsActive` (Flag)
    - [ ] `CreatedAt`, `UpdatedAt`
  - [ ] Migration erstellen
- [ ] Backend: Controller CRUD für Rücklieferungsgründe (nur Admin)
  - [ ] **CREATE**: POST `/api/return-reasons` - Nur Admin
  - [ ] **READ**: GET `/api/return-reasons` - Alle können lesen
  - [ ] **UPDATE**: PUT `/api/return-reasons/{id}` - Nur Admin
  - [ ] **DELETE**: DELETE `/api/return-reasons/{id}` - Nur Admin
- [ ] Backend: Authorization
  - [ ] [Authorize(Roles = "Admin")] für CREATE, UPDATE, DELETE
  - [ ] GET ist öffentlich (für Dropdown)
- [ ] Frontend: Admin-UI für Rücklieferungsgründe-Verwaltung
  - [ ] Screen "Rücklieferungsgründe verwalten"
  - [ ] Liste aller Gründe
  - [ ] **Create**: Formular für neuen Grund
    - [ ] Name-Feld
    - [ ] Beschreibung-Feld
    - [ ] Submit-Button
  - [ ] **Read**: Liste anzeigen
    - [ ] Name
    - [ ] Beschreibung
    - [ ] Status (Aktiv/Inaktiv)
  - [ ] **Update**: Edit-Button öffnet Edit-Formular
    - [ ] Vorausgefüllte Felder
    - [ ] Speichern-Button
  - [ ] **Delete**: Delete-Button mit Bestätigung
- [ ] Frontend: Navigation
  - [ ] Link im Admin-Menü
  - [ ] Nur für Admin-Rolle sichtbar

### 19. Begründungsgründe-Verwaltung (Admin) - CRUD
- [ ] Backend: Datenbank-Modell
  - [ ] `Reason` Tabelle erstellen (siehe auch Punkt 12)
    - [ ] `Id` (Primary Key)
    - [ ] `Name` (Begründungstext)
    - [ ] `Description` (Beschreibung)
    - [ ] `Category` (Optional: Kategorie)
    - [ ] `IsActive` (Flag)
    - [ ] `CreatedAt`, `UpdatedAt`
  - [ ] Migration erstellen
- [ ] Backend: Controller CRUD für Begründungsgründe (nur Admin)
  - [ ] **CREATE**: POST `/api/reasons`
    - [ ] Request Body validieren
    - [ ] Neuen Grund in Datenbank speichern
    - [ ] Response mit erstelltem Grund zurückgeben
  - [ ] **READ**: GET `/api/reasons`
    - [ ] Alle aktiven Gründe zurückgeben
    - [ ] GET `/api/reasons/all` - Alle (auch inaktive) für Admin
    - [ ] GET `/api/reasons/{id}` - Einzelnen Grund abrufen
  - [ ] **UPDATE**: PUT `/api/reasons/{id}`
    - [ ] Request Body validieren
    - [ ] Grund in Datenbank aktualisieren
    - [ ] Response mit aktualisiertem Grund
  - [ ] **DELETE**: DELETE `/api/reasons/{id}`
    - [ ] Soft Delete (IsActive = false) oder Hard Delete
    - [ ] Prüfen ob Grund in Verwendung (Warenausgänge)
    - [ ] Fehlerbehandlung
- [ ] Backend: Authorization
  - [ ] [Authorize(Roles = "Admin")] für CREATE, UPDATE, DELETE
  - [ ] GET `/api/reasons` ist öffentlich (für Dropdown)
  - [ ] GET `/api/reasons/all` nur für Admin
- [ ] Frontend: Admin-UI für Begründungsgründe-Verwaltung
  - [ ] Screen "Begründungsgründe verwalten"
  - [ ] **Create**: Formular für neuen Grund
    - [ ] Name-Feld (Pflichtfeld)
    - [ ] Beschreibung-Feld (optional)
    - [ ] Kategorie-Dropdown (optional)
    - [ ] Submit-Button
    - [ ] Validierung
    - [ ] Erfolgsmeldung
  - [ ] **Read**: Liste anzeigen
    - [ ] Tabelle/Liste mit allen Gründen
    - [ ] Spalten: Name, Beschreibung, Status, Aktionen
    - [ ] Filter nach Status (Aktiv/Inaktiv)
    - [ ] Sortierung
    - [ ] Pagination (falls viele Einträge)
  - [ ] **Update**: Edit-Funktionalität
    - [ ] Edit-Button bei jedem Eintrag
    - [ ] Modal/Sheet mit Edit-Formular
    - [ ] Vorausgefüllte Felder
    - [ ] Aktiv/Inaktiv Toggle
    - [ ] Speichern-Button
    - [ ] Abbrechen-Button
  - [ ] **Delete**: Lösch-Funktionalität
    - [ ] Delete-Button bei jedem Eintrag
    - [ ] Bestätigungsdialog
    - [ ] Warnung wenn Grund in Verwendung
    - [ ] Soft Delete (Inaktiv setzen) oder Hard Delete
    - [ ] Erfolgsmeldung
- [ ] Frontend: Navigation
  - [ ] Link im Admin-Menü/Profil
  - [ ] Nur für Admin-Rolle sichtbar
  - [ ] Icon/Button für schnellen Zugriff

---

## 📝 ZUSÄTZLICHE TECHNISCHE ANFORDERUNGEN

### 20. API-Integration
- [ ] Alle neuen Endpoints dokumentieren (Swagger)
- [ ] Error Handling einheitlich
- [ ] Response-Format konsistent
- [ ] CORS-Einstellungen prüfen

### 21. Datenbank-Migrationen
- [ ] Alle Migrationen testen
- [ ] Rollback-Funktionalität sicherstellen
- [ ] Datenintegrität prüfen
- [ ] Foreign Keys korrekt setzen

### 22. Frontend-State-Management
- [ ] Warenkorb-State verwalten (Context/Redux)
- [ ] Offline-Funktionalität für Warenkorb
- [ ] Synchronisation mit Backend

### 23. Testing
- [ ] Unit Tests für Backend-Logik
- [ ] Integration Tests für API-Endpoints
- [ ] Frontend-Komponenten Tests (optional)
- [ ] E2E Tests für kritische Flows

### 24. UI/UX Verbesserungen
- [ ] Konsistente Farbpalette
- [ ] Responsive Design auf verschiedenen Bildschirmgrößen
- [ ] Loading-States
- [ ] Error-States und Fehlermeldungen
- [ ] Success-Feedback
- [ ] Accessibility (Optional)

---

## 🚫 ENTFERNT/ABGESAGT

- ~~**2FA für Admins**~~ - Nicht mehr geplant

---

## 📊 FORTSCHRITT

**Gesamt: 0/20 Hauptfeatures** (0%)

**Backend: 0/X Tasks**
**Frontend: 0/X Tasks**
**Testing: 0/X Tasks**

---

*Letzte Aktualisierung: [Datum]*



























