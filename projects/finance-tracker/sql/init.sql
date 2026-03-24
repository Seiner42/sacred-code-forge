PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  icon TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
  amount REAL NOT NULL,
  category_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  charge_day INTEGER,
  charge_month INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  file_name TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  rows_count INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  rows_needing_review INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ready', 'processing', 'failed')),
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  import_id TEXT,
  operation_date TEXT NOT NULL,
  raw_merchant TEXT NOT NULL DEFAULT '',
  merchant_normalized TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  direction TEXT NOT NULL CHECK (direction IN ('expense', 'income')),
  category_id TEXT,
  source_category TEXT,
  mcc TEXT,
  description TEXT,
  source_row_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS merchant_rules (
  id TEXT PRIMARY KEY,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains')),
  pattern TEXT NOT NULL,
  merchant_normalized TEXT NOT NULL,
  category_id TEXT,
  direction_override TEXT CHECK (direction_override IN ('expense', 'income')),
  priority INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS import_review_items (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL,
  raw_merchant TEXT NOT NULL,
  source_category TEXT,
  mcc TEXT,
  sample_count INTEGER NOT NULL DEFAULT 1,
  suggested_merchant_normalized TEXT,
  suggested_category_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_rule_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_rule_id) REFERENCES merchant_rules(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_operation_date ON transactions(operation_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_import_id ON transactions(import_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_source_row_hash ON transactions(source_row_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_operation_order ON transactions(operation_date DESC, source_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category_id ON subscriptions(category_id);
CREATE INDEX IF NOT EXISTS idx_imports_imported_at ON imports(imported_at);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_priority ON merchant_rules(priority DESC, pattern);
CREATE INDEX IF NOT EXISTS idx_review_items_import_id ON import_review_items(import_id);
