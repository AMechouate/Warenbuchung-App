/**
 * database.ts
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
import * as SQLite from 'expo-sqlite';
import { Product, Wareneingang, Warenausgang } from '../types';

const DB_NAME = 'warenbuchung.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      console.log('🗄️ Initializing database...');
      // Close existing database connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.log('Database was already closed or error closing:', closeError);
        }
        this.db = null;
      }

      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      console.log('📁 Database opened:', DB_NAME);
      await this.createTables();
      console.log('📋 Tables created');
      await this.migrateTables();
      console.log('🔄 Migrations completed');
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      
      // If database is corrupted, try to delete and recreate
      try {
        console.log('Attempting to reset corrupted database...');
        
        // Close database first
        if (this.db) {
          try {
            await this.db.closeAsync();
          } catch (closeError) {
            console.log('Error closing database:', closeError);
          }
          this.db = null;
        }
        
        // Wait a bit before deleting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await SQLite.deleteDatabaseAsync(DB_NAME);
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        await this.createTables();
        console.log('Database reset and recreated successfully');
      } catch (resetError) {
        console.error('Error resetting database:', resetError);
        // Try to continue without database
        this.db = null;
        console.log('Continuing without local database...');
      }
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create Products table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        stockQuantity INTEGER NOT NULL,
        locationStock REAL NOT NULL DEFAULT 0,
        unit TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        isDirty INTEGER DEFAULT 0,
        lastSynced TEXT
      );
    `);

    // Create Wareneingaenge table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS wareneingaenge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        productId INTEGER NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        supplier TEXT,
        batchNumber TEXT,
        expiryDate TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        isDirty INTEGER DEFAULT 0,
        lastSynced TEXT,
        FOREIGN KEY (productId) REFERENCES products (id)
      );
    `);

    // Create Warenausgaenge table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS warenausgaenge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        productId INTEGER NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        customer TEXT,
        orderNumber TEXT,
        notes TEXT,
        auswahlGrund TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        isDirty INTEGER DEFAULT 0,
        lastSynced TEXT,
        FOREIGN KEY (productId) REFERENCES products (id)
      );
    `);

    // Create SyncQueue table for offline operations
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        tableName TEXT NOT NULL,
        recordId INTEGER NOT NULL,
        data TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
  }

  private async migrateTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if auswahlGrund column exists in warenausgaenge table
      const columns = await this.db.getAllAsync(`
        PRAGMA table_info(warenausgaenge)
      `);
      
      const hasAuswahlGrund = columns.some(col => col.name === 'auswahlGrund');
      
      if (!hasAuswahlGrund) {
        console.log('Adding auswahlGrund column to warenausgaenge table...');
        await this.db.execAsync(`
          ALTER TABLE warenausgaenge ADD COLUMN auswahlGrund TEXT
        `);
        console.log('Migration completed successfully');
      }

      const productColumns = await this.db.getAllAsync(`
        PRAGMA table_info(products)
      `);

      const hasLocationStock = productColumns.some(col => col.name === 'locationStock');

      if (!hasLocationStock) {
        console.log('Adding locationStock column to products table...');
        await this.db.execAsync(`
          ALTER TABLE products ADD COLUMN locationStock REAL NOT NULL DEFAULT 0
        `);
        console.log('locationStock column added to products table');
      }
    } catch (error) {
      console.error('Migration error:', error);
      // If migration fails, recreate the table
      console.log('Recreating warenausgaenge table...');
      await this.db.execAsync(`DROP TABLE IF EXISTS warenausgaenge`);
      await this.createTables();
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM products ORDER BY name
    `);
    
    return result.map(row => ({
      id: row.serverId || row.id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      price: row.price,
      stockQuantity: row.stockQuantity,
      locationStock: row.locationStock ?? 0,
      unit: row.unit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getProduct(id: number): Promise<Product | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(`
      SELECT * FROM products WHERE id = ? OR serverId = ?
    `, [id, id]);
    
    if (!result) return null;
    
    return {
      id: result.serverId || result.id,
      name: result.name,
      description: result.description,
      sku: result.sku,
      price: result.price,
      stockQuantity: result.stockQuantity,
      locationStock: result.locationStock ?? 0,
      unit: result.unit,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async saveProduct(product: Product, isDirty: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT OR REPLACE INTO products 
      (serverId, name, description, sku, price, stockQuantity, locationStock, unit, createdAt, updatedAt, isDirty, lastSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product.id,
      product.name,
      product.description || null,
      product.sku,
      product.price,
      product.stockQuantity,
      product.locationStock ?? 0,
      product.unit || null,
      product.createdAt,
      product.updatedAt || null,
      isDirty ? 1 : 0,
      new Date().toISOString(),
    ]);
  }

  async deleteProduct(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      DELETE FROM products WHERE id = ? OR serverId = ?
    `, [id, id]);
  }

  // Wareneingang methods
  async getWareneingaenge(): Promise<Wareneingang[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('📖 Loading Wareneingaenge from local database...');
    const result = await this.db.getAllAsync(`
      SELECT * FROM wareneingaenge ORDER BY createdAt DESC
    `);
    
    console.log('📊 Raw database result:', result.length, 'items');
    const mappedResult = result.map(row => ({
      id: row.serverId || row.id,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.totalPrice,
      supplier: row.supplier,
      batchNumber: row.batchNumber,
      expiryDate: row.expiryDate,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
    
    console.log('✅ Mapped Wareneingaenge:', mappedResult.length, 'items');
    return mappedResult;
  }

  async saveWareneingang(wareneingang: Wareneingang, isDirty: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('💾 Saving Wareneingang to local database:', wareneingang);
    console.log('🔧 isDirty:', isDirty);
    
    const result = await this.db.runAsync(`
      INSERT OR REPLACE INTO wareneingaenge 
      (serverId, productId, productName, quantity, unitPrice, totalPrice, supplier, batchNumber, expiryDate, notes, createdAt, updatedAt, isDirty, lastSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      wareneingang.id,
      wareneingang.productId,
      wareneingang.productName,
      wareneingang.quantity,
      wareneingang.unitPrice,
      wareneingang.totalPrice,
      wareneingang.supplier || null,
      wareneingang.batchNumber || null,
      wareneingang.expiryDate || null,
      wareneingang.notes || null,
      wareneingang.createdAt,
      wareneingang.updatedAt || null,
      isDirty ? 1 : 0,
      new Date().toISOString(),
    ]);
    
    console.log('✅ Wareneingang saved to database, result:', result);
  }

  // Warenausgang methods
  async getWarenausgaenge(): Promise<Warenausgang[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM warenausgaenge ORDER BY createdAt DESC
    `);
    
    return result.map(row => ({
      id: row.serverId || row.id,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.totalPrice,
      customer: row.customer,
      orderNumber: row.orderNumber,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async saveWarenausgang(warenausgang: Warenausgang, isDirty: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT OR REPLACE INTO warenausgaenge 
      (serverId, productId, productName, quantity, unitPrice, totalPrice, customer, orderNumber, notes, auswahlGrund, createdAt, updatedAt, isDirty, lastSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      warenausgang.id,
      warenausgang.productId,
      warenausgang.productName,
      warenausgang.quantity,
      warenausgang.unitPrice,
      warenausgang.totalPrice,
      warenausgang.customer || null,
      warenausgang.orderNumber || null,
      warenausgang.notes || null,
      (warenausgang as any).auswahlGrund || null,
      warenausgang.createdAt,
      warenausgang.updatedAt || null,
      isDirty ? 1 : 0,
      new Date().toISOString(),
    ]);
  }

  // Sync methods
  async getDirtyRecords(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const products = await this.db.getAllAsync(`
      SELECT 'products' as tableName, * FROM products WHERE isDirty = 1
    `);
    
    const wareneingaenge = await this.db.getAllAsync(`
      SELECT 'wareneingaenge' as tableName, * FROM wareneingaenge WHERE isDirty = 1
    `);
    
    const warenausgaenge = await this.db.getAllAsync(`
      SELECT 'warenausgaenge' as tableName, * FROM warenausgaenge WHERE isDirty = 1
    `);
    
    return [...products, ...wareneingaenge, ...warenausgaenge];
  }

  async markRecordSynced(tableName: string, recordId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE ${tableName} 
      SET isDirty = 0, lastSynced = ? 
      WHERE id = ? OR serverId = ?
    `, [new Date().toISOString(), recordId, recordId]);
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync(`
      DELETE FROM products;
      DELETE FROM wareneingaenge;
      DELETE FROM warenausgaenge;
      DELETE FROM sync_queue;
    `);
  }

  async resetDatabase(): Promise<void> {
    try {
      await SQLite.deleteDatabaseAsync(DB_NAME);
      this.db = null;
      await this.init();
      console.log('Database completely reset');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
