export const SCHEMA_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS item_storage_options (
    item_id TEXT NOT NULL,
    storage_type TEXT NOT NULL CHECK (storage_type IN ('Refrigerated', 'Frozen')),
    sort_order INTEGER NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    PRIMARY KEY (item_id, storage_type),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS item_form_options (
    item_id TEXT NOT NULL,
    form TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    PRIMARY KEY (item_id, form),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shelf_lives (
    item_id TEXT NOT NULL,
    form TEXT NOT NULL,
    storage_type TEXT NOT NULL CHECK (storage_type IN ('Refrigerated', 'Frozen')),
    shelf_life_hours INTEGER NOT NULL CHECK (shelf_life_hours > 0),
    is_placeholder INTEGER NOT NULL DEFAULT 1 CHECK (is_placeholder IN (0, 1)),
    source_note TEXT NOT NULL,
    PRIMARY KEY (item_id, form, storage_type),
    FOREIGN KEY (item_id, form) REFERENCES item_form_options(item_id, form) ON DELETE CASCADE,
    FOREIGN KEY (item_id, storage_type) REFERENCES item_storage_options(item_id, storage_type) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    form TEXT NOT NULL,
    storage_type TEXT NOT NULL CHECK (storage_type IN ('Refrigerated', 'Frozen')),
    made_at TEXT NOT NULL,
    use_by_at TEXT NOT NULL,
    staff_id INTEGER,
    staff_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'thrown_away')),
    printed_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS labels_active_use_by_idx
    ON labels(status, use_by_at);
`;
