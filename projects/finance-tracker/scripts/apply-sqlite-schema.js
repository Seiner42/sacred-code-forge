const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'data', 'finance-tracker.db');
const sqlPath = path.join(projectRoot, 'sql', 'init.sql');

const sql = fs.readFileSync(sqlPath, 'utf8');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(sql);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log(JSON.stringify({ dbPath, tables }, null, 2));
db.close();
