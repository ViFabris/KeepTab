export const SCHEMA_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    language TEXT NOT NULL CHECK (language IN ('en', 'pt-BR')),
    date_order TEXT NOT NULL CHECK (date_order IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
    time_format TEXT NOT NULL CHECK (time_format IN ('12h', '24h')),
    spell_out_month INTEGER NOT NULL CHECK (spell_out_month IN (0, 1)),
    time_zone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    clock_offset_ms INTEGER NOT NULL DEFAULT 0,
    label_width_mm REAL NOT NULL,
    label_height_mm REAL NOT NULL,
    printer_profile_json TEXT NOT NULL DEFAULT '',
    printer_threshold_percent INTEGER NOT NULL DEFAULT 50,
    default_print_copies INTEGER NOT NULL DEFAULT 1,
    jurisdiction TEXT NOT NULL DEFAULT 'RS' CHECK (jurisdiction IN ('RS', 'OTHER')),
    fridge_at_or_below_4c INTEGER NOT NULL DEFAULT 0 CHECK (fridge_at_or_below_4c IN (0, 1)),
    reduced_maximum_days INTEGER NOT NULL DEFAULT 3 CHECK (reduced_maximum_days > 0),
    verification_mode TEXT NOT NULL DEFAULT 'strict' CHECK (verification_mode IN ('strict', 'test')),
    legal_notice_seen INTEGER NOT NULL DEFAULT 0 CHECK (legal_notice_seen IN (0, 1)),
    setup_complete INTEGER NOT NULL DEFAULT 0 CHECK (setup_complete IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS label_options (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('storage', 'form')),
    translation_key TEXT,
    custom_label TEXT,
    legacy_value TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    applies_to_all INTEGER NOT NULL DEFAULT 0 CHECK (applies_to_all IN (0, 1)),
    temperature_class TEXT CHECK (temperature_class IN ('refrigerated', 'frozen', 'ambient')),
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    plant_based_type TEXT NOT NULL DEFAULT 'none' CHECK (plant_based_type IN ('none', 'drink', 'food')),
    heat_treated INTEGER NOT NULL DEFAULT 0 CHECK (heat_treated IN (0, 1)),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified')),
    verified_by TEXT NOT NULL DEFAULT '',
    verified_on TEXT NOT NULL DEFAULT '',
    manufacturer_days_after_open INTEGER CHECK (manufacturer_days_after_open > 0),
    source TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS item_storage_options (
    item_id TEXT NOT NULL,
    storage_type TEXT NOT NULL,
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
    prepared_food INTEGER NOT NULL DEFAULT 0 CHECK (prepared_food IN (0, 1)),
    PRIMARY KEY (item_id, form),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shelf_lives (
    item_id TEXT NOT NULL,
    form TEXT NOT NULL,
    storage_type TEXT NOT NULL,
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
    form_option_id TEXT,
    storage_type TEXT NOT NULL,
    storage_option_id TEXT,
    made_at TEXT NOT NULL,
    use_by_at TEXT NOT NULL,
    staff_id INTEGER,
    staff_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'thrown_away')),
    printed_at TEXT NOT NULL,
    label_width_mm REAL NOT NULL DEFAULT 60,
    label_height_mm REAL NOT NULL DEFAULT 40,
    jurisdictions_json TEXT NOT NULL DEFAULT '[]',
    rules_version TEXT NOT NULL DEFAULT '',
    capped_by_rule_id TEXT,
    item_verification_status TEXT NOT NULL DEFAULT 'unverified',
    verification_mode TEXT NOT NULL DEFAULT 'strict',
    printer_profile_json TEXT NOT NULL DEFAULT '{}',
    app_version TEXT NOT NULL DEFAULT '',
    package_scan_id INTEGER,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    FOREIGN KEY (form_option_id) REFERENCES label_options(id),
    FOREIGN KEY (storage_option_id) REFERENCES label_options(id)
  );

  CREATE INDEX IF NOT EXISTS labels_active_use_by_idx
    ON labels(status, use_by_at);

  CREATE TABLE IF NOT EXISTS label_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('used', 'thrown_away')),
    occurred_at TEXT NOT NULL,
    person_name TEXT NOT NULL,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS rule_reviews (
    rule_id TEXT PRIMARY KEY NOT NULL,
    reviewed_on TEXT NOT NULL,
    reviewed_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS package_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    barcode_value TEXT NOT NULL,
    barcode_format TEXT NOT NULL,
    gtin TEXT NOT NULL DEFAULT '',
    lot_code TEXT NOT NULL DEFAULT '',
    package_expiry_date TEXT NOT NULL DEFAULT '',
    manufacturer_days_after_open INTEGER CHECK (manufacturer_days_after_open > 0),
    photo_uri TEXT NOT NULL DEFAULT '',
    confirmed_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS package_scans_gtin_idx
    ON package_scans(gtin, confirmed_at DESC);
`;
