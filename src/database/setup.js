const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from external keys directory
dotenv.config({ path: '/home/simrob1729/keys/.env' });

// Default DB path if not specified in env
const DEFAULT_DB_PATH = path.join(__dirname, '../../../data/sand_finance.db');
const DB_PATH = process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;

// Ensure the directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create a database connection
const createDbConnection = () => {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
};

// Initialize database tables
const setupDatabase = () => {
  const db = createDbConnection();

  // Create tables if they don't exist
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sheet metadata table - maps sheet IDs to descriptions and access info
    db.run(`CREATE TABLE IF NOT EXISTS sheet_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      access_level TEXT DEFAULT 'read',
      last_synced TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Column metadata table - describes the columns in each sheet
    db.run(`CREATE TABLE IF NOT EXISTS column_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_id TEXT NOT NULL,
      column_name TEXT NOT NULL,
      display_name TEXT,
      data_type TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sheet_id, column_name),
      FOREIGN KEY (sheet_id) REFERENCES sheet_metadata(sheet_id)
    )`);

    // Query history table - tracks natural language queries
    db.run(`CREATE TABLE IF NOT EXISTS query_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query_text TEXT NOT NULL,
      processed_query TEXT,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN,
      error_message TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // User feedback table - stores feedback on query results
    db.run(`CREATE TABLE IF NOT EXISTS user_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id INTEGER NOT NULL,
      user_id INTEGER,
      feedback_type TEXT NOT NULL,
      feedback_text TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES query_history(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Reports table - stores generated reports
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER,
      report_type TEXT,
      content TEXT, -- This can store JSON or other structured data
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    console.log('Database tables initialized.');
  });

  db.close();
};

module.exports = {
  createDbConnection,
  setupDatabase,
};
