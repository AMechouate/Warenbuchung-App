# 📱 Warenbuchung-App - Szenarien-Dokumentation

## 🎯 Übersicht

Diese Dokumentation beschreibt die wichtigsten Anwendungsszenarien der Warenbuchung-App mit detaillierten Erklärungen, Screenshots und Schritt-für-Schritt Anleitungen.

---

## 📋 Inhaltsverzeichnis

1. [App-Start und Authentifizierung](#app-start-und-authentifizierung)
2. [Produktverwaltung](#produktverwaltung)
3. [Wareneingang-Szenarien](#wareneingang-szenarien)
4. [Warenausgang-Szenarien](#warenausgang-szenarien)
5. [Projektmanagement](#projektmanagement)
6. [Offline-Funktionalität](#offline-funktionalität)
7. [Benutzerprofil und Einstellungen](#benutzerprofil-und-einstellungen)

---

## 🚀 App-Start und Authentifizierung

### Szenario 1: App-Start und Loading Screen

**Beschreibung:** Beim Start der App wird ein eleganter Loading Screen mit dem Polygon-Logo angezeigt.

**Was passiert:**
- App initialisiert die lokale SQLite-Datenbank
- Überprüft die Authentifizierung
- Lädt die Benutzeroberfläche

**Screenshot-Beschreibung:**
- Polygon-Logo in der Mitte
- "Warenbuchung App" Titel
- Rotierender Ladeindikator
- Saubere, moderne Optik mit hellblauem Design

**Technische Details:**
- Loading Screen dauert ca. 2-5 Sekunden
- Automatische Datenbankinitialisierung
- Retry-Logik bei Fehlern
- Smooth Transition zur Login-Seite

### Szenario 2: Benutzeranmeldung

**Beschreibung:** Standardmäßige Anmeldung mit Benutzername und Passwort.

**Schritt-für-Schritt:**
1. App startet und zeigt Login-Screen
2. Benutzer gibt Anmeldedaten ein
3. System validiert Anmeldedaten
4. Bei Erfolg: Weiterleitung zur Hauptseite
5. Bei Fehler: Fehlermeldung anzeigen

**Standard-Anmeldedaten:**
- **Benutzername:** `admin` / **Passwort:** `admin123`
- **Benutzername:** `user1` / **Passwort:** `admin123`
- **Benutzername:** `user2` / **Passwort:** `admin123`

**Screenshot-Beschreibung:**
- Polygon-Logo oben
- "Warenbuchung App" Titel
- Benutzername-Eingabefeld
- Passwort-Eingabefeld
- "Anmelden" Button
- "Registrieren" Link

### Szenario 3: Benutzerregistrierung

**Beschreibung:** Neue Benutzer können sich registrieren.

**Schritt-für-Schritt:**
1. Auf "Registrieren" klicken
2. Registrierungsformular ausfüllen
3. System erstellt neuen Benutzer
4. Automatische Anmeldung nach Registrierung

**Registrierungsfelder:**
- Vorname
- Nachname
- Benutzername
- E-Mail
- Passwort
- Passwort bestätigen

---

## 📦 Produktverwaltung

### Szenario 4: Produktübersicht anzeigen

**Beschreibung:** Anzeige aller verfügbaren Produkte in einer übersichtlichen Liste.

**Was wird angezeigt:**
- 24 verschiedene Produkte
- Kategorien: Apple, Dell, HP, LG, Microsoft, Sony, Logitech, Keychron, Samsung, Baustoffe
- Produktdetails: Name, Beschreibung, SKU, Preis, Lagerbestand, Einheit

**Produktkategorien:**
- **Apple Produkte:** iPhone, iPad, MacBook, AirPods, Apple Watch
- **Business-Laptops:** Dell, HP, Lenovo
- **Monitore:** LG, Microsoft Surface
- **Audio-Geräte:** Sony, Logitech
- **Peripherie:** Keychron Tastaturen
- **Baustoffe:** Schrauben, Dübel, Kleber, Kabel

**Screenshot-Beschreibung:**
- Tab-Navigation unten
- Produktliste mit Suchfeld
- Jedes Produkt als Card mit:
  - Produktname
  - Beschreibung
  - SKU-Code
  - Preis
  - Lagerbestand
  - Einheit (Stück/Palette/Paket)

### Szenario 5: Produktsuche

**Beschreibung:** Benutzer können Produkte schnell finden.

**Suchfunktionen:**
- Echtzeitsuche während der Eingabe
- Suche nach Name, Beschreibung oder SKU
- Filterung nach Kategorien
- Offline-Suche möglich

**Screenshot-Beschreibung:**
- Suchfeld oben
- Filterbare Ergebnisse
- Highlighting der Suchbegriffe

### Szenario 6: Neues Produkt hinzufügen

**Beschreibung:** Lagerpersonal kann neue Produkte zur Datenbank hinzufügen.

**Schritt-für-Schritt:**
1. Auf "+" Button klicken
2. Produktformular ausfüllen
3. Produkt speichern
4. Automatische Synchronisation

**Produktfelder:**
- Name
- Beschreibung
- SKU (Stock Keeping Unit)
- Preis
- Lagerbestand
- Einheit (Stück/Palette/Paket)

---

## 📥 Wareneingang-Szenarien

### Szenario 7: Standard-Wareneingang (Bestellung)

**Beschreibung:** Erfassung eines Wareneingangs durch eine Bestellung.

**Schritt-für-Schritt:**
1. **Wareneingang-Tab öffnen** - Navigation zu Wareneingängen
2. **Erfassungstyp wählen** - Auf "Erfassungstyp" klicken öffnet ein Popup-Menü mit 4 Optionen:
   - Bestellung
   - Projekt (Baustelle)
   - Lager
   - Ohne Bestellung
3. **Bestellung auswählen** - Im Popup auf "Bestellung" klicken
4. **Erfassungstyp wird oben angezeigt** - "Bestellung" erscheint oben unter dem Label
5. **Artikelnummer eingeben/auswählen/suchen** - Benutzer kann:
   - Artikelnummer manuell eingeben
   - Aus der Artikelliste auswählen
   - Artikelnummer mit Barcode-Scanner scannen
6. **Menge eingeben** - Benutzer gibt die Menge ein
7. **Einheit auswählen** - Benutzer wählt die Einheit aus:
   - **Automatische Anpassung:** Die Einheit passt sich automatisch an den ausgewählten Artikel an
   - **Manuelle Anpassung:** Benutzer kann die Einheit ändern (Stück/Palette/Paket)
   - **Palette-Umrechnung:** Bei Auswahl von Palette erscheint Info: "1 Palette = 80 Stück"
8. **Lieferant auswählen:**
   - **Automatisch:** Wenn Artikel nur von einem Lieferanten kommt, wird Lieferantennummer automatisch eingetragen
   - **Manuell:** Wenn Artikel von mehreren Lieferanten kommt (kein Standardlieferant definiert), bleibt das Feld leer und Benutzer muss manuell den Lieferanten eingeben oder aus einer Liste auswählen
9. **Buchung abschließen** - Auf "Buchung abschließen" Button klicken
10. **Buchung gespeichert** - Buchung wird in History angezeigt

**Nach der Buchung:**
- **History-Anzeige:** Beim Unterscrollen sieht der Benutzer die letzten 5 Wareneingänge
- **Aktuelle Buchung oben:** Die gerade gespeicherte Buchung erscheint ganz oben mit allen Details
- **Vollständige Informationen:** Alle relevanten Informationen sind sichtbar:
  - Artikelname
  - Menge mit Einheit
  - Lieferant
  - Datum/Zeit
  - Preisinformationen

**Screenshot-Beschreibung:**
- Erfassungstyp-Dropdown mit 4 Optionen
- Artikelnummer-Eingabe/-Suche
- Mengeneingabe
- Einheitsauswahl mit Automatik-Anpassung
- Palette-Info ("1 Palette = 80 Stück")
- Lieferanten-Dropdown (wenn mehrere verfügbar)
- Speichern-Button
- History-Liste mit letzten 5 Einträgen

**Prozessbaum-Diagramm:**

```
Wareneingang-Tab öffnen
│
├─ Erfassungstyp wählen
│  │
│  └─ Popup-Menü öffnet sich
│     │
│     ├─ Bestellung ✓
│     ├─ Projekt (Baustelle)
│     ├─ Lager
│     └─ Ohne Bestellung
│
├─ "Bestellung" ausgewählt
│  │
│  └─ Erfassungstyp-Anzeige aktualisiert
│
├─ Artikelnummer eingeben/auswählen
│  │
│  ├─ Manuell eingeben
│  ├─ Aus Artikelliste auswählen
│  └─ Barcode scannen
│
├─ Menge eingeben
│
├─ Einheit auswählen
│  │
│  ├─ Automatische Anpassung
│  ├─ Manuelle Anpassung
│  │  │
│  │  └─ Palette → Info: "1 Palette = 80 Stück"
│  └─ Stück/Palette/Paket
│
├─ Lieferant auswählen
│  │
│  ├─ Automatisch (ein Lieferant)
│  └─ Dropdown-Liste (mehrere Lieferanten)
│
├─ "Buchung abschließen" Button klicken
│
└─ Buchung gespeichert
   │
   └─ History-Anzeige
      │
      ├─ Neue Buchung erscheint oben
      └─ Letzte 5 Wareneingänge sichtbar
         │
         └─ Details: Name, Menge, Lieferant, Datum, Preis
```

### Szenario 8: Projekt-Wareneingang (Baustelle)

**Beschreibung:** Spezielle Erfassung für Baustellen-Projekte mit Projektzuordnung.

**Schritt-für-Schritt:**
1. **Erfassungstyp wählen** - Im Popup-Menü auf "Projekt (Baustelle)" klicken
2. **Projektnummer eingeben/auswählen:**
   - **Projektnummer manuell eingeben** ODER
   - **In der Projektliste suchen** und Projekt auswählen
3. **Alle Materialien und Geräte anzeigen** - Nach Projektauswahl erscheinen alle diesem Projekt zugewiesenen Materialien und Geräte
4. **Material/Gerät auswählen** - Benutzer wählt ein spezifisches Material oder Gerät aus
5. **Menge eingeben** - Benutzer gibt die Menge für das ausgewählte Material/Gerät ein
6. **Buchen-Button aktiviert** - Sobald eine Menge eingegeben wurde, wird der "Buchen" Button aktiviert
7. **Buchung abschließen** - Benutzer klickt auf "Buchen"
8. **Menge wird auf null gesetzt** - Nach dem Klicken wird die Menge automatisch auf null zurückgesetzt
9. **Buchung gespeichert** - Die Buchung wird gespeichert
10. **Buchen-Button deaktiviert** - Der Button wird wieder deaktiviert, um doppelte Einträge zu vermeiden
11. **Letzte Buchung wird unten angezeigt** - Die zuletzt gebuchte Ware wird unten in der Liste angezeigt

**Zusätzliche Features:**
- **History-Funktion:** Rechts oben bei jedem Material/Gerät befinden sich 3 vertikale Punkte (⋮)
  - Beim Klicken öffnet sich die History aller gebuchten Mengen für dieses Material/Gerät
  - Zeigt alle vergangenen Buchungen chronologisch an
- **Filter-Funktion:** Oben in der Mitte befindet sich eine Filter-/Suchfunktion
  - Ermöglicht schnelles Suchen nach gesuchten Materialien oder Geräten
  - Echtzeit-Filterung während der Eingabe

**Besonderheiten:**
- Projektnummer erforderlich für Baustellen-Projekte
- Baustoff-spezifische Lieferanten
- Teilweise verbrauchte Pakete (0,5, 1,5, 2,5)
- Projekt-spezifische Materialverfolgung
- Überblick über alle Projekte-Materialien und -Geräte
- Verhindert doppelte Einträge durch automatische Deaktivierung

**Baustoff-Kategorien:**
- **Schrauben:** Verschiedene Größen und Typen
- **Dübel:** Wanddübel, Deckenanker
- **Kleber:** Montagekleber, Dichtstoffe
- **Kabel:** Elektrokabel, Netzwerkkabel

**Screenshot-Beschreibung:**
- Projektauswahl-Dropdown
- Projektliste mit Suchfunktion
- Material-/Geräteliste für das ausgewählte Projekt
- Mengeneingabe pro Material/Gerät
- Aktives/Inaktives "Buchen" Button
- History-Button (3 Punkte) bei jedem Material/Gerät
- Filter-Suchfeld oben in der Mitte
- Untere Liste mit letzten Buchungen

**Prozessbaum-Diagramm:**

```
Erfassungstyp wählen
│
└─ Popup-Menü → "Projekt (Baustelle)" ✓
   │
   ├─ Projektnummer eingeben/auswählen
   │  │
   │  ├─ Projektnummer manuell eingeben
   │  └─ In Projektliste suchen und auswählen
   │
   ├─ Projekt ausgewählt
   │  │
   │  └─ Alle Projekt-Materialien und -Geräte laden
   │
   ├─ Material/Gerät auswählen
   │  │
   │  ├─ Materialliste mit Filter-Funktion
   │  │  │
   │  │  └─ Filter-Suchfeld (oben Mitte) für schnelle Suche
   │  │
   │  └─ Material/Gerät Details anzeigen
   │
   ├─ Menge eingeben
   │  │
   │  └─ Menge wird eingegeben (z.B. 0.5, 1.5, 2.5)
   │
   ├─ "Buchen" Button wird aktiviert ✓
   │
   ├─ "Buchen" Button klicken
   │  │
   │  ├─ Buchung wird gespeichert
   │  │
   │  ├─ Menge wird auf null zurückgesetzt
   │  │
   │  └─ "Buchen" Button wird deaktiviert (verhindert Doppelbuchungen)
   │
   └─ Buchung abgeschlossen
      │
      ├─ Letzte Buchung wird unten angezeigt
      │  │
      │  └─ Details: Material, Menge, Datum, Zeit
      │
      └─ History-Funktion verfügbar
         │
         └─ 3-Punkte-Menü (⋮) bei jedem Material/Gerät
            │
            └─ History aller Buchungen öffnen
               │
               └─ Chronologische Liste aller gebuchten Mengen
```

**Wiederholbarer Prozess:**
```
Material auswählen → Menge eingeben → Buchen → Button deaktiviert
    ↓                                           ↑
    └──────────────────────────────────────────┘
        (Menge automatisch auf null gesetzt)
```

### Szenario 9: Palette-Wareneingang mit Umrechnung

**Beschreibung:** Wareneingang von Paletten mit automatischer Stück-Umrechnung.

**Umrechnungslogik:**
- 1 Palette = 80 Stück
- Automatische Berechnung des Stückpreises
- Lagerbestand wird in Stück aktualisiert
- Anzeige sowohl in Palette als auch Stück

**Screenshot-Beschreibung:**
- Einheitenauswahl: "Palette"
- Automatische Umrechnung zu Stück
- Anzeige: "1 Palette (80 Stück)"
- Preisberechnung pro Stück

### Szenario 10: Paket-Wareneingang mit Dezimalzahlen

**Beschreibung:** Erfassung von teilweise verbrauchten Paketen.

**Besonderheiten:**
- Dezimalzahl-Eingabe (0,5, 1,5, 2,5)
- +/- Buttons mit 0,5 Schritten
- Komma-Support für deutsche Eingabe
- Präzise Lagerbestandsführung

**Anwendungsfall:**
- Halbes Paket Schrauben verwendet
- 1,5 Pakete Dübel geliefert
- 2,5 Pakete Kleber verbraucht

---

## 📤 Warenausgang-Szenarien

### Szenario 11: Projekt-Warenausgang

**Beschreibung:** Komplexer Warenausgang mit Projektzuordnung, Bestandsprüfung und Überschreitungskontrolle.

**Schritt-für-Schritt-Anleitung:**

1. **Warenausgangstyp auswählen:**
   - Auf "Warenausgangstyp wählen" Button klicken
   - Popup-Menü öffnet sich mit Optionen:
     - **Projekt** ✓
     - **Lager**
     - **Entsorgung**
     - **Rücksendung Lieferant**
   - "Projekt" auswählen

2. **Projekt auswählen:**
   - "Projekt auswählen" Button wird sichtbar
   - Bei Klick öffnet sich Liste mit **aktiven Projekten**
   - Projekt-Details anzeigen:
     - Projektname
     - Beschreibung
     - Status (Aktiv, Pausiert, Abgeschlossen)
     - Start- und Enddatum
   - Ein Projekt aus der Liste auswählen

3. **Artikelnummer eingeben/auswählen:**
   - Artikelnummer kann **manuell eingegeben** werden
   - Oder auf "Artikel auswählen" Button klicken
   - Produktliste wird angezeigt
   - Artikel aus Liste auswählen
   - Oder **Barcode scannen** (optional)

4. **Menge eingeben:**
   - Anzahl des Artikels eingeben
   - **Verfügbar-Anzeige** zeigt aktuellen Lagerbestand an:
     - "Verfügbar: X Stück"
     - Warnung falls Bestand überschritten: "⚠️ Überschritten!"

5. **Einheit anpassen:**
   - Standard-Einheit des Produkts wird angezeigt
   - Benutzer kann Einheit ändern:
     - **Stück** (Standard)
     - **Palette** (1 Palette = 80 Stück)
     - **Paket** (für teilweise Verbrauch)
   - Bei Palette-Auswahl erscheint Info: "ℹ️ 1 Palette = 80 Stück"

6. **Bestandsüberschreitung behandeln:**
   - Falls eingegebene Menge **Lagerbestand überschreitet**:
     - **Pop-Up-Dialog** erscheint automatisch
     - Warnung: "Sie haben X Stück eingegeben, aber nur Y Stück sind verfügbar. Eine Übersteuerung ist möglich, aber eine Begründung ist erforderlich."
     - System bietet **Grund-Auswahl**:
       - Kommission
       - Auftrag
       - Umbuchung
       - Beschädigung
     - Benutzer wählt einen Grund aus
     - **Textnachricht-Feld** erscheint zum Verfassen der Begründung
     - Benutzer kann auch aus **Vorlagen** wählen:
       - Notfall-Entnahme für dringenden Auftrag
       - Nachbestellung bereits veranlasst
       - Lieferant bestätigt Nachschub
       - Interne Umbuchung zwischen Standorten
       - etc.
     - Textnachricht wird eingegeben

7. **Buchung abschließen:**
   - "Buchung abschließen" Button klicken
   - Warenausgang wird gespeichert
   - "Buchung wurde erfolgreich abgeschlossen" Bestätigung

8. **History-Anzeige:**
   - Neue Buchung erscheint in "Letzte Warenausgänge"
   - **Sichtbare Warnhinweise:**
     - **Rote Warnung**: "⚠️ Diese Buchung überschreitet den Lagerbestand! Bestand geht negativ."
     - **Gelbe Nachricht**: Zeigt den gewählten Grund und die verfasste Nachricht
   - Bestandsanzeige wird in **negatives Rot** gesetzt

**Besonderheiten:**
- ✅ Projektauswahl mit Status-Anzeige
- ✅ Automatische Bestandsprüfung
- ✅ Flexibel anpassbare Einheiten (Stück, Palette, Paket)
- ✅ Überschreitungskontrolle mit Pflicht-Begründung
- ✅ Vorlagensystem für häufige Begründungen
- ✅ Visuelle Warnungen bei negativem Bestand
- ✅ Detaillierte Historie mit Gründen

**Prozessbaum-Diagramm:**

```
Warenausgang-Tab öffnen
│
├─ "Warenausgangstyp wählen" Button klicken
│  │
│  └─ Popup-Menü öffnet sich
│     │
│     ├─ Projekt ✓
│     ├─ Lager
│     ├─ Entsorgung
│     └─ Rücksendung Lieferant
│
├─ "Projekt" ausgewählt
│  │
│  ├─ "Projekt auswählen" Button erscheint
│  │
│  ├─ "Projekt auswählen" Button klicken
│  │  │
│  │  └─ Projektliste wird angezeigt
│  │     │
│  │     ├─ Projektdetails anzeigen:
│  │     │  ├─ Name
│  │     │  ├─ Beschreibung
│  │     │  ├─ Status (Aktiv/Pausiert/Abgeschlossen)
│  │     │  └─ Start- und Enddatum
│  │     │
│  │     └─ Projekt auswählen ✓
│  │
│  ├─ Projekt ausgewählt ✓
│  │
│  ├─ Artikelnummer eingeben/auswählen
│  │  │
│  │  ├─ Artikelnummer manuell eingeben
│  │  ├─ "Artikel auswählen" Button → Produktliste
│  │  └─ Barcode scannen
│  │
│  ├─ Artikel ausgewählt ✓
│  │  │
│  │  └─ Verfügbar-Anzeige: "Verfügbar: X Stück"
│  │
│  ├─ Menge eingeben
│  │  │
│  │  ├─ Anzahl eingeben (z.B. 150)
│  │  │
│  │  ├─ Bestandsprüfung:
│  │  │  │
│  │  │  ├─ Menge ≤ Lagerbestand?
│  │  │  │  └─ ✓ Normaler Vorgang
│  │  │  │
│  │  │  └─ Menge > Lagerbestand?
│  │  │     │
│  │  │     └─ ⚠️ Warn-Popup erscheint:
│  │  │        │
│  │  │        ├─ Meldung: "Sie haben 150 Stück eingegeben, 
│  │  │        │              aber nur 100 Stück sind verfügbar"
│  │  │        │
│  │  │        ├─ Grund auswählen:
│  │  │        │  ├─ Kommission
│  │  │        │  ├─ Auftrag
│  │  │        │  ├─ Umbuchung
│  │  │        │  └─ Beschädigung
│  │  │        │
│  │  │        ├─ Textnachricht verfassen:
│  │  │        │  ├─ Manuell eingeben
│  │  │        │  └─ Oder Vorlage wählen
│  │  │        │
│  │  │        └─ "Bestätigen" klicken
│  │  │
│  │  └─ "⚠️ Überschritten!" Warnung angezeigt
│  │
│  ├─ Einheit auswählen (optional)
│  │  │
│  │  ├─ Produkt-Standard-Einheit
│  │  ├─ Palette (mit Info: 1 Palette = 80 Stück)
│  │  └─ Paket
│  │
│  ├─ "Buchung abschließen" Button klicken
│  │
│  └─ Buchung gespeichert ✓
│     │
│     └─ History-Anzeige
│        │
│        ├─ Neue Buchung erscheint oben
│        │
│        ├─ **Rote Warnung**: "⚠️ Diese Buchung überschreitet den 
│        │                      Lagerbestand! Bestand geht negativ."
│        │
│        ├─ **Gelbe Nachricht**: Gründe und Text angezeigt
│        │
│        └─ Bestandsanzeige in negativem Rot
```

---

### Szenario 12: Lager-/Entsorgungs-/Rücksendung-Warenausgang

**Beschreibung:** Warenausgang für andere Warenausgangstypen ohne Projektzuordnung.

**Besonderheiten:**
- Einfachere Struktur ohne Projektauswahl
- Gleiche Bestandsprüfung und Überschreitungskontrolle
- Typ-spezifische Validierung

**Verfügbare Typen:**
- **Lager**: Interne Lagerverlagerung
- **Entsorgung**: Abfallentsorgung
- **Rücksendung Lieferant**: Retoure an Lieferanten

---

## 🏗️ Projektmanagement

### Szenario 13: Projekt-Materialien verwalten

**Beschreibung:** Übersicht aller Materialien für ein spezifisches Projekt.

**Funktionen:**
- Projektauswahl
- Materialliste pro Projekt
- Verbrauch pro Material
- Restbestände
- Projekt-Historie

**Screenshot-Beschreibung:**
- Projekt-Dropdown oben
- Materialliste mit Verbrauch
- Fortschrittsanzeige
- Verbrauchshistorie

### Szenario 14: Projekt-Historie anzeigen

**Beschreibung:** Detaillierte Historie aller Bewegungen für ein Projekt.

**Anzeige:**
- Alle Wareneingänge
- Alle Warenausgänge
- Zeitstempel
- Benutzerinformationen
- Mengen und Einheiten

---

## 🔄 Offline-Funktionalität

### Szenario 15: Offline-Wareneingang

**Beschreibung:** Wareneingang auch ohne Internetverbindung.

**Was passiert:**
- Daten werden lokal gespeichert
- Automatische Synchronisation bei Verbindung
- Offline-Indikator zeigt Status
- Keine Datenverluste

**Screenshot-Beschreibung:**
- Offline-Indikator oben
- Normale Wareneingang-Funktionalität
- Lokale Speicherung bestätigt

### Szenario 16: Synchronisation bei Verbindung

**Beschreibung:** Automatische Synchronisation der Offline-Daten.

**Prozess:**
- App erkennt Internetverbindung
- Automatische Synchronisation startet
- Offline-Daten werden übertragen
- Bestätigung der Synchronisation

---

## 👤 Benutzerprofil und Einstellungen

### Szenario 17: Benutzerprofil anzeigen

**Beschreibung:** Anzeige der Benutzerinformationen und Einstellungen.

**Anzeige:**
- Benutzername
- E-Mail
- Vorname und Nachname
- Lagerort
- Letzte Anmeldung
- Verbindungsstatus

### Szenario 18: Lagerort konfigurieren

**Beschreibung:** Benutzer kann seinen Lagerort festlegen.

**Schritt-für-Schritt:**
1. Profil-Tab öffnen
2. Lagerort-Einstellungen öffnen
3. Lagerort eingeben
4. Speichern
5. Automatische Übernahme bei Wareneingängen

### Szenario 19: Abmelden

**Beschreibung:** Sichere Abmeldung vom System.

**Prozess:**
- Abmelden-Button klicken
- Bestätigung der Abmeldung
- Zurück zum Login-Screen
- Session wird beendet

---

## 🎯 Besondere Features

### Intelligente Einheitenverwaltung

**Stück-Einheit:**
- Standard-Einheit für alle Produkte
- Ganzzahlige Mengen
- Direkte Lagerbestandsführung

**Palette-Einheit:**
- Automatische Umrechnung: 1 Palette = 80 Stück
- Preisberechnung pro Stück
- Lagerbestand in Stück

**Paket-Einheit:**
- Dezimalzahl-Unterstützung (0,5, 1,5, 2,5)
- Teilweise verbrauchte Pakete
- Präzise Mengenerfassung

### Lieferanten-Management

**Mehrere Lieferanten pro Produkt:**
- Intelligente Dropdown-Auswahl
- Freundliche Anzeigenamen
- Spezialisierte Lieferanten

**Lieferanten-Kategorien:**
- Offizielle Partner (Apple, Microsoft, Sony)
- Spezialisierte Händler (Tech Corp, Business Solutions)
- Baustoff-Spezialisten (Baustoffe GmbH, Hardware Pro)

### Offline-First Architektur

**Vollständige Offline-Funktionalität:**
- SQLite lokale Datenbank
- Offline-Wareneingänge und -ausgänge
- Automatische Synchronisation
- Keine Datenverluste

---

## 📊 Screenshot-Guide

### Empfohlene Screenshots für Dokumentation:

1. **Loading Screen** - App-Start mit Polygon-Logo
2. **Login Screen** - Anmeldeoberfläche
3. **Hauptnavigation** - Tab-Navigation mit allen Bereichen
4. **Produktliste** - Übersicht aller Produkte
5. **Wareneingang-Formular** - Neuer Wareneingang
6. **Warenausgang-Formular** - Neuer Warenausgang
7. **Projekt-Materialien** - Projektübersicht
8. **Offline-Indikator** - Offline-Modus
9. **Benutzerprofil** - Profil und Einstellungen
10. **Synchronisation** - Datenübertragung

### Screenshot-Beschreibungen:

**Für jeden Screenshot sollte dokumentiert werden:**
- Was wird angezeigt
- Welche Funktionen sind verfügbar
- Benutzerinteraktionen
- Technische Besonderheiten
- Kontext und Anwendungsfall

---

## 🔧 Technische Hinweise

### Performance-Optimierungen

**Lokale Datenbank:**
- Schnelle Offline-Zugriffe
- Automatische Synchronisation
- Effiziente Speicherung

**UI-Optimierungen:**
- Smooth Transitions
- Responsive Design
- Touch-optimierte Bedienung

### Sicherheit

**Authentifizierung:**
- JWT Token-basiert
- Sichere Passwort-Speicherung
- Session-Management

**Datenintegrität:**
- Validierung auf Client und Server
- Fehlerbehandlung
- Backup-Funktionen

---

## 📱 Plattform-Unterstützung

### iOS
- Vollständige Funktionalität
- Native Performance
- App Store bereit

### Android
- Vollständige Funktionalität
- Native Performance
- Google Play Store bereit

### Cross-Platform
- Einheitliche Benutzererfahrung
- Geteilte Codebasis
- Einfache Wartung

---

## 🎉 Fazit

Die Warenbuchung-App bietet eine umfassende Lösung für:

✅ **Moderne Warenbuchung** mit intuitiver Bedienung  
✅ **Offline-Funktionalität** für Feldarbeit  
✅ **Projektmanagement** für Baustellen  
✅ **Intelligente Einheitenverwaltung** mit Umrechnungen  
✅ **Lieferanten-Management** mit Mehrfachzuordnung  
✅ **Cross-Platform** Unterstützung  
✅ **Sichere Authentifizierung** und Datenverwaltung  

Die App ist produktionsreif und kann sofort in der Praxis eingesetzt werden! 🚀
