import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");
const dbPath = path.join(dataDir, "finance-tracker.db");
const schemaPath = path.join(projectRoot, "sql", "init.sql");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  try {
    db.exec(schema);
  } catch {
    // Старая база может не принять часть индексов до добавления новых колонок.
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

function getColumns(tableName: string) {
  return new Set((db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[]).map((column) => column.name));
}

function ensureColumn(tableName: string, columnName: string, sql: string) {
  const columns = getColumns(tableName);
  if (!columns.has(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${sql}`);
  }
}

ensureColumn("imports", "rows_imported", "rows_imported INTEGER NOT NULL DEFAULT 0");
ensureColumn("imports", "rows_skipped", "rows_skipped INTEGER NOT NULL DEFAULT 0");
ensureColumn("imports", "rows_needing_review", "rows_needing_review INTEGER NOT NULL DEFAULT 0");
ensureColumn("imports", "rows_failed", "rows_failed INTEGER NOT NULL DEFAULT 0");

ensureColumn("transactions", "import_id", "import_id TEXT");
ensureColumn("transactions", "raw_merchant", "raw_merchant TEXT NOT NULL DEFAULT ''");
ensureColumn("transactions", "source_category", "source_category TEXT");
ensureColumn("transactions", "mcc", "mcc TEXT");
ensureColumn("transactions", "source_row_hash", "source_row_hash TEXT");

ensureColumn("subscriptions", "charge_day", "charge_day INTEGER");
ensureColumn("subscriptions", "charge_month", "charge_month INTEGER");

if (!db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_transactions_source_row_hash'").get()) {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_source_row_hash ON transactions(source_row_hash)");
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transactions_import_id ON transactions(import_id);
  CREATE INDEX IF NOT EXISTS idx_imports_imported_at ON imports(imported_at);
  CREATE INDEX IF NOT EXISTS idx_merchant_rules_priority ON merchant_rules(priority DESC, pattern);
  CREATE INDEX IF NOT EXISTS idx_review_items_import_id ON import_review_items(import_id);
`);
