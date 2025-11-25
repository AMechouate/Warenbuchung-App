# Datenbank-Schema - Warenbuchung App (MariaDB)

## Übersicht

Dieses Dokument enthält die vollständigen SQL CREATE TABLE Statements für die MariaDB-Datenbank `warenbuchung`.

**Datenbank-Informationen:**
- **Version:** MariaDB 11.2.3
- **Charset:** utf8mb4
- **Collation:** utf8mb4_unicode_ci
- **Engine:** InnoDB
- **Erstellt:** 2025-11-25

---

## CREATE TABLE Statements

### 1. Products

```sql
CREATE TABLE `Products` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `SKU` varchar(50) NOT NULL,
  `Price` decimal(18,2) NOT NULL,
  `ItemType` varchar(50) NOT NULL,
  `StockQuantity` int(11) NOT NULL,
  `LocationStock` decimal(18,2) NOT NULL,
  `Unit` varchar(50) DEFAULT NULL,
  `DefaultSupplier` varchar(100) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Products_SKU` (`SKU`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Wareneingaenge

```sql
CREATE TABLE `Wareneingaenge` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `Quantity` decimal(18,2) NOT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `TotalPrice` decimal(18,2) NOT NULL,
  `Erfassungstyp` varchar(50) DEFAULT NULL,
  `Referenz` varchar(100) DEFAULT NULL,
  `Location` varchar(100) DEFAULT NULL,
  `Supplier` varchar(100) DEFAULT NULL,
  `BatchNumber` varchar(50) DEFAULT NULL,
  `ExpiryDate` datetime(6) DEFAULT NULL,
  `Notes` varchar(500) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Wareneingaenge_ProductId` (`ProductId`),
  CONSTRAINT `FK_Wareneingaenge_Products_ProductId` 
    FOREIGN KEY (`ProductId`) REFERENCES `Products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Warenausgaenge

```sql
CREATE TABLE `Warenausgaenge` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `TotalPrice` decimal(18,2) NOT NULL,
  `Customer` varchar(100) DEFAULT NULL,
  `OrderNumber` varchar(50) DEFAULT NULL,
  `Notes` varchar(500) DEFAULT NULL,
  `Attribut` varchar(50) DEFAULT NULL,
  `ProjectName` varchar(100) DEFAULT NULL,
  `Begruendung` varchar(500) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Warenausgaenge_ProductId` (`ProductId`),
  CONSTRAINT `FK_Warenausgaenge_Products_ProductId` 
    FOREIGN KEY (`ProductId`) REFERENCES `Products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. Suppliers

```sql
CREATE TABLE `Suppliers` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `ContactPerson` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Phone` varchar(50) DEFAULT NULL,
  `Address` varchar(500) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Suppliers_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. Orders

```sql
CREATE TABLE `Orders` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `OrderNumber` varchar(100) NOT NULL,
  `OrderDate` datetime(6) NOT NULL,
  `Status` varchar(50) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `SupplierId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Orders_OrderNumber` (`OrderNumber`),
  KEY `IX_Orders_SupplierId` (`SupplierId`),
  CONSTRAINT `FK_Orders_Suppliers_SupplierId` 
    FOREIGN KEY (`SupplierId`) REFERENCES `Suppliers` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. OrderAssignedItems

```sql
CREATE TABLE `OrderAssignedItems` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `OrderId` int(11) NOT NULL,
  `ProductId` int(11) NOT NULL,
  `DefaultQuantity` decimal(18,2) NOT NULL,
  `Unit` varchar(50) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_OrderAssignedItems_OrderId_ProductId` (`OrderId`, `ProductId`),
  KEY `IX_OrderAssignedItems_ProductId` (`ProductId`),
  CONSTRAINT `FK_OrderAssignedItems_Orders_OrderId` 
    FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_OrderAssignedItems_Products_ProductId` 
    FOREIGN KEY (`ProductId`) REFERENCES `Products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. ProjectAssignedItems

```sql
CREATE TABLE `ProjectAssignedItems` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ProjectKey` varchar(100) NOT NULL,
  `ProductId` int(11) NOT NULL,
  `DefaultQuantity` decimal(18,2) NOT NULL,
  `Unit` varchar(50) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_ProjectAssignedItems_ProjectKey_ProductId` (`ProjectKey`, `ProductId`),
  KEY `IX_ProjectAssignedItems_ProductId` (`ProductId`),
  CONSTRAINT `FK_ProjectAssignedItems_Products_ProductId` 
    FOREIGN KEY (`ProductId`) REFERENCES `Products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. Users

```sql
CREATE TABLE `Users` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Username` varchar(100) NOT NULL,
  `Email` varchar(200) NOT NULL,
  `PasswordHash` longtext NOT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `IsAdmin` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `LastLoginAt` datetime(6) DEFAULT NULL,
  `Locations` longtext DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Users_Username` (`Username`),
  UNIQUE KEY `IX_Users_Email` (`Email`),
  KEY `IX_Users_IsActive` (`IsActive`),
  KEY `IX_Users_IsAdmin` (`IsAdmin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. WarenausgangReasons

```sql
CREATE TABLE `WarenausgangReasons` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `OrderIndex` int(11) NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_WarenausgangReasons_Name` (`Name`),
  KEY `IX_WarenausgangReasons_OrderIndex` (`OrderIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. JustificationTemplates

```sql
CREATE TABLE `JustificationTemplates` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Text` varchar(500) NOT NULL,
  `OrderIndex` int(11) NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_JustificationTemplates_OrderIndex` (`OrderIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Foreign Key Constraints

| Constraint Name | From Table | From Column | To Table | To Column | On Delete |
|----------------|------------|-------------|----------|-----------|----------|
| `FK_Wareneingaenge_Products_ProductId` | Wareneingaenge | ProductId | Products | Id | CASCADE |
| `FK_Warenausgaenge_Products_ProductId` | Warenausgaenge | ProductId | Products | Id | CASCADE |
| `FK_Orders_Suppliers_SupplierId` | Orders | SupplierId | Suppliers | Id | SET NULL |
| `FK_OrderAssignedItems_Orders_OrderId` | OrderAssignedItems | OrderId | Orders | Id | CASCADE |
| `FK_OrderAssignedItems_Products_ProductId` | OrderAssignedItems | ProductId | Products | Id | CASCADE |
| `FK_ProjectAssignedItems_Products_ProductId` | ProjectAssignedItems | ProductId | Products | Id | CASCADE |

---

## Datenbank erstellen

```sql
CREATE DATABASE IF NOT EXISTS `warenbuchung` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

---

## Benutzer und Rechte

```sql
-- Benutzer erstellen (falls noch nicht vorhanden)
CREATE USER IF NOT EXISTS 'adammechouate'@'localhost' IDENTIFIED BY 'naima';

-- Rechte vergeben
GRANT ALL PRIVILEGES ON warenbuchung.* TO 'adammechouate'@'localhost';

-- Rechte aktualisieren
FLUSH PRIVILEGES;
```

---

## Nützliche SQL-Befehle

### Tabellen anzeigen
```sql
SHOW TABLES;
```

### Tabellenstruktur anzeigen
```sql
DESCRIBE Products;
-- oder
SHOW CREATE TABLE Products;
```

### Alle Foreign Keys anzeigen
```sql
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'warenbuchung'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Alle Indizes anzeigen
```sql
SHOW INDEX FROM Products;
```

### Datenbankgröße anzeigen
```sql
SELECT 
  table_schema AS 'Datenbank',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Größe (MB)'
FROM information_schema.tables
WHERE table_schema = 'warenbuchung'
GROUP BY table_schema;
```

---

## Version
- **Erstellt:** 2025-11-25
- **Datenbank:** MariaDB 11.2.3
- **Migration:** InitialCreate (20251125124845)

