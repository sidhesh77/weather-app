const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'weather.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_input TEXT NOT NULL,
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    date_start TEXT,
    date_end TEXT,
    temperature REAL,
    feels_like REAL,
    humidity INTEGER,
    wind_speed REAL,
    weather_code INTEGER,
    description TEXT,
    forecast_json TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;