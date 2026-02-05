import Database from 'better-sqlite3';
 const db = new Database('database.sqlite');
 
 db.exec(`
 CREATE TABLE IF NOT EXISTS customers (
   id INTEGER PRIMARY KEY,
   telegram_user_id TEXT UNIQUE,
   username TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE TABLE IF NOT EXISTS payments (
   id INTEGER PRIMARY KEY,
   customer_id INTEGER,
   amount INTEGER,
   status TEXT,
   invoice_id TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE TABLE IF NOT EXISTS access (
   id INTEGER PRIMARY KEY,
   customer_id INTEGER,
   expires_at DATETIME
 );
 `);
 
 export default db;