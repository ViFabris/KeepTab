import type { SQLiteDatabase } from 'expo-sqlite';

import { findNearestLabelTemplate } from '../printing/labelTemplates';
import { DEFAULT_PRINTER_PROFILE } from '../printing/PrinterProfile';
import { withWriteTransaction } from './transactions';

interface TableColumn {
  name: string;
}

const DEFAULT_OPTIONS = [
  ['storage-refrigerated', 'storage', 'storage.refrigerated', 'Refrigerated', 0, 0, 'refrigerated'],
  ['storage-frozen', 'storage', 'storage.frozen', 'Frozen', 1, 0, 'frozen'],
  ['form-whole', 'form', 'form.whole', 'Whole', 0, 0, null],
  ['form-cut', 'form', 'form.cut', 'Cut', 1, 0, null],
  ['form-other', 'form', 'form.other', 'Other', 2, 1, null],
  ['form-cooked', 'form', 'form.cooked', 'Cooked', 3, 0, null],
  ['form-raw', 'form', 'form.raw', 'Raw', 4, 0, null],
  ['form-in-shell', 'form', 'form.inShell', 'In shell', 5, 0, null],
  ['form-peeled', 'form', 'form.peeled', 'Peeled', 6, 0, null],
  ['form-opened', 'form', 'form.opened', 'Opened', 7, 0, null],
  ['form-unopened', 'form', 'form.unopened', 'Unopened', 8, 0, null],
  ['form-shredded', 'form', 'form.shredded', 'Shredded', 9, 0, null],
] as const;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateLabelsTable(db);
  await migrateClockSettings(db);
  await migratePrinterSettings(db);
  await migrateFoodSafetySettings(db);
  await migrateItemSafetyFields(db);
  await migrateKitchenManagedCatalog(db);
  await migrateStorageValueConstraints(db);
  await seedDefaultOptions(db);
  await migrateAuditTrail(db);
  await migratePackageEvidence(db);
  await migrateManufacturerEvidence(db);
  await migratePackageBatches(db);
  await initializeSettings(db);
  await migrateLabelSizeSetting(db);
  await linkExistingLabelsToOptions(db);
  await db.execAsync('PRAGMA user_version = 8');
}

const LEGACY_SEED_ITEM_IDS = [
  'cucumber', 'tomato', 'lettuce', 'onion', 'bell-pepper', 'carrot', 'celery',
  'broccoli', 'chicken-breast', 'ground-beef', 'cooked-rice', 'hard-boiled-egg',
  'deli-turkey', 'cheese', 'soup',
] as const;

async function migrateKitchenManagedCatalog(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'items', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
  await db.runAsync("UPDATE app_settings SET verification_mode = 'strict' WHERE id = 1");
  const version = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'kitchen_managed_catalog_version'`,
  );
  if (version?.value === '1') return;
  const placeholders = LEGACY_SEED_ITEM_IDS.map(() => '?').join(', ');
  await withWriteTransaction(db, async (transaction) => {
    await transaction.runAsync(
      `UPDATE items SET is_active = 0 WHERE id IN (${placeholders})`,
      ...LEGACY_SEED_ITEM_IDS,
    );
    await transaction.runAsync(
      `INSERT INTO app_metadata (key, value) VALUES ('kitchen_managed_catalog_version', '1')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
  });
}

async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const columns = await db.getAllAsync<TableColumn>(`PRAGMA table_info(${table})`);
  if (!columns.some((candidate) => candidate.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function migrateFoodSafetySettings(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'app_settings', 'jurisdiction', "TEXT NOT NULL DEFAULT 'RS'");
  await addColumnIfMissing(db, 'app_settings', 'fridge_at_or_below_4c', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'app_settings', 'reduced_maximum_days', 'INTEGER NOT NULL DEFAULT 3');
  await addColumnIfMissing(db, 'app_settings', 'verification_mode', "TEXT NOT NULL DEFAULT 'strict'");
  await addColumnIfMissing(db, 'app_settings', 'legal_notice_seen', 'INTEGER NOT NULL DEFAULT 0');
}

async function migrateItemSafetyFields(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'label_options', 'temperature_class', 'TEXT');
  await db.runAsync("UPDATE label_options SET temperature_class = 'refrigerated' WHERE id = 'storage-refrigerated'");
  await db.runAsync("UPDATE label_options SET temperature_class = 'frozen' WHERE id = 'storage-frozen'");
  await addColumnIfMissing(db, 'items', 'plant_based_type', "TEXT NOT NULL DEFAULT 'none'");
  await addColumnIfMissing(db, 'items', 'heat_treated', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'items', 'verification_status', "TEXT NOT NULL DEFAULT 'unverified'");
  await addColumnIfMissing(db, 'items', 'verified_by', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, 'items', 'verified_on', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, 'items', 'manufacturer_days_after_open', 'INTEGER');
  await addColumnIfMissing(db, 'items', 'source', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, 'item_form_options', 'prepared_food', 'INTEGER NOT NULL DEFAULT 0');
  await db.execAsync(`
    UPDATE item_form_options SET prepared_food = 1 WHERE form IN ('Cut', 'Cooked', 'Other');
    UPDATE item_form_options SET prepared_food = 0 WHERE form IN ('Whole', 'Opened');
  `);
}

async function migrateStorageValueConstraints(db: SQLiteDatabase): Promise<void> {
  const migrated = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'storage_value_constraints_version'`,
  );
  if (migrated?.value === '1') return;

  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await withWriteTransaction(db, async (transaction) => {
      await transaction.execAsync(`
        CREATE TABLE item_storage_options_open (
          item_id TEXT NOT NULL,
          storage_type TEXT NOT NULL,
          sort_order INTEGER NOT NULL,
          is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
          PRIMARY KEY (item_id, storage_type),
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        );
        INSERT INTO item_storage_options_open
          (item_id, storage_type, sort_order, is_default)
        SELECT item_id, storage_type, sort_order, is_default
        FROM item_storage_options;

        CREATE TABLE shelf_lives_open (
          item_id TEXT NOT NULL,
          form TEXT NOT NULL,
          storage_type TEXT NOT NULL,
          shelf_life_hours INTEGER NOT NULL CHECK (shelf_life_hours > 0),
          is_placeholder INTEGER NOT NULL DEFAULT 1 CHECK (is_placeholder IN (0, 1)),
          source_note TEXT NOT NULL,
          PRIMARY KEY (item_id, form, storage_type),
          FOREIGN KEY (item_id, form) REFERENCES item_form_options(item_id, form) ON DELETE CASCADE,
          FOREIGN KEY (item_id, storage_type) REFERENCES item_storage_options_open(item_id, storage_type) ON DELETE CASCADE
        );
        INSERT INTO shelf_lives_open
          (item_id, form, storage_type, shelf_life_hours, is_placeholder, source_note)
        SELECT item_id, form, storage_type, shelf_life_hours, is_placeholder, source_note
        FROM shelf_lives;

        DROP TABLE shelf_lives;
        DROP TABLE item_storage_options;
        ALTER TABLE item_storage_options_open RENAME TO item_storage_options;
        ALTER TABLE shelf_lives_open RENAME TO shelf_lives;
      `);
      await transaction.runAsync(
        `INSERT INTO app_metadata (key, value) VALUES ('storage_value_constraints_version', '1')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      );
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}

async function migrateAuditTrail(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'labels', 'jurisdictions_json', "TEXT NOT NULL DEFAULT '[]'");
  await addColumnIfMissing(db, 'labels', 'rules_version', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, 'labels', 'capped_by_rule_id', 'TEXT');
  await addColumnIfMissing(db, 'labels', 'item_verification_status', "TEXT NOT NULL DEFAULT 'unverified'");
  await addColumnIfMissing(db, 'labels', 'verification_mode', "TEXT NOT NULL DEFAULT 'strict'");
  await addColumnIfMissing(db, 'labels', 'verification_basis', "TEXT NOT NULL DEFAULT 'test'");
  await addColumnIfMissing(db, 'labels', 'printer_profile_json', "TEXT NOT NULL DEFAULT '{}'");
  await addColumnIfMissing(db, 'labels', 'app_version', "TEXT NOT NULL DEFAULT ''");
  await db.execAsync(`
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
  `);
}

async function migratePackageEvidence(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'labels', 'package_scan_id', 'INTEGER');
  await addColumnIfMissing(db, 'labels', 'lot_code', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, 'labels', 'product_barcode', "TEXT NOT NULL DEFAULT ''");
  await db.execAsync(`
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
  `);
}

async function migrateManufacturerEvidence(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'items', 'registration_complete', 'INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing(db, 'package_scans', 'product_photo_uri', "TEXT NOT NULL DEFAULT ''");
}

async function migratePackageBatches(db: SQLiteDatabase): Promise<void> {
  await addColumnIfMissing(db, 'package_scans', 'status', "TEXT NOT NULL DEFAULT 'sealed'");
  await addColumnIfMissing(db, 'package_scans', 'opened_at', 'TEXT');
  await addColumnIfMissing(db, 'package_scans', 'closed_at', 'TEXT');
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS package_scans_active_item_idx
      ON package_scans(item_id, status, package_expiry_date);
    CREATE TABLE IF NOT EXISTS label_package_scans (
      label_id INTEGER NOT NULL,
      package_scan_id INTEGER NOT NULL,
      PRIMARY KEY (label_id, package_scan_id),
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE RESTRICT,
      FOREIGN KEY (package_scan_id) REFERENCES package_scans(id) ON DELETE RESTRICT
    );
    INSERT OR IGNORE INTO label_package_scans (label_id, package_scan_id)
      SELECT id, package_scan_id FROM labels WHERE package_scan_id IS NOT NULL;
  `);
}

async function migratePrinterSettings(db: SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<TableColumn>('PRAGMA table_info(app_settings)');
  if (!columns.some((column) => column.name === 'printer_profile_json')) {
    await db.execAsync("ALTER TABLE app_settings ADD COLUMN printer_profile_json TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === 'printer_threshold_percent')) {
    await db.execAsync('ALTER TABLE app_settings ADD COLUMN printer_threshold_percent INTEGER NOT NULL DEFAULT 50');
  }
  if (!columns.some((column) => column.name === 'default_print_copies')) {
    await db.execAsync('ALTER TABLE app_settings ADD COLUMN default_print_copies INTEGER NOT NULL DEFAULT 1');
  }
  await db.runAsync(
    "UPDATE app_settings SET printer_profile_json = ? WHERE printer_profile_json = ''",
    JSON.stringify(DEFAULT_PRINTER_PROFILE),
  );
}

async function migrateLabelSizeSetting(db: SQLiteDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'label_size_preset_version'`,
  );
  if (version?.value === '1') return;

  const current = await db.getFirstAsync<{ label_width_mm: number; label_height_mm: number }>(
    'SELECT label_width_mm, label_height_mm FROM app_settings WHERE id = 1',
  );
  if (!current) return;
  const nearest = findNearestLabelTemplate(current.label_width_mm, current.label_height_mm);
  await withWriteTransaction(db, async (transaction) => {
    await transaction.runAsync(
      'UPDATE app_settings SET label_width_mm = ?, label_height_mm = ? WHERE id = 1',
      nearest.widthMm,
      nearest.heightMm,
    );
    await transaction.runAsync(
      `INSERT INTO app_metadata (key, value) VALUES ('label_size_preset_version', '1')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
  });
}

async function migrateClockSettings(db: SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<TableColumn>('PRAGMA table_info(app_settings)');
  if (!columns.some((column) => column.name === 'time_zone')) {
    await db.execAsync(
      "ALTER TABLE app_settings ADD COLUMN time_zone TEXT NOT NULL DEFAULT 'America/Sao_Paulo'",
    );
  }
  if (!columns.some((column) => column.name === 'clock_offset_ms')) {
    await db.execAsync(
      'ALTER TABLE app_settings ADD COLUMN clock_offset_ms INTEGER NOT NULL DEFAULT 0',
    );
  }
}

async function seedDefaultOptions(db: SQLiteDatabase): Promise<void> {
  await withWriteTransaction(db, async (transaction) => {
    for (const option of DEFAULT_OPTIONS) {
      await transaction.runAsync(
        `INSERT OR IGNORE INTO label_options
          (id, kind, translation_key, custom_label, legacy_value, sort_order, applies_to_all, temperature_class, enabled)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1)`,
        ...option,
      );
    }
  });
}

async function migrateLabelsTable(db: SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<TableColumn>('PRAGMA table_info(labels)');
  if (columns.some((column) => column.name === 'form_option_id')) {
    return;
  }

  await withWriteTransaction(db, async (transaction) => {
    await transaction.execAsync(`
      CREATE TABLE labels_migrated (
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
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
        FOREIGN KEY (form_option_id) REFERENCES label_options(id),
        FOREIGN KEY (storage_option_id) REFERENCES label_options(id)
      );

      INSERT INTO labels_migrated
        (id, item_id, item_name, form, storage_type, made_at, use_by_at,
         staff_id, staff_name, status, printed_at)
      SELECT id, item_id, item_name, form, storage_type, made_at, use_by_at,
             staff_id, staff_name, status, printed_at
      FROM labels;

      DROP TABLE labels;
      ALTER TABLE labels_migrated RENAME TO labels;
      CREATE INDEX labels_active_use_by_idx ON labels(status, use_by_at);
    `);
  });
}

async function initializeSettings(db: SQLiteDatabase): Promise<void> {
  const legacyLanguage = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'language'`,
  );
  const language = legacyLanguage?.value === 'en' ? 'en' : 'pt-BR';
  const dateOrder = language === 'pt-BR' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
  const timeFormat = language === 'pt-BR' ? '24h' : '12h';

  await db.runAsync(
    `INSERT OR IGNORE INTO app_settings
      (id, language, date_order, time_format, spell_out_month,
       time_zone, clock_offset_ms, label_width_mm, label_height_mm,
       printer_profile_json, printer_threshold_percent, default_print_copies, setup_complete)
     VALUES (1, ?, ?, ?, 1, 'America/Sao_Paulo', 0, 60, 40, ?, 50, 1, 0)`,
    language,
    dateOrder,
    timeFormat,
    JSON.stringify(DEFAULT_PRINTER_PROFILE),
  );
}

async function linkExistingLabelsToOptions(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    UPDATE labels
    SET form_option_id = (
      SELECT id FROM label_options
      WHERE kind = 'form' AND legacy_value = labels.form
      LIMIT 1
    )
    WHERE form_option_id IS NULL;

    UPDATE labels
    SET storage_option_id = (
      SELECT id FROM label_options
      WHERE kind = 'storage' AND legacy_value = labels.storage_type
      LIMIT 1
    )
    WHERE storage_option_id IS NULL;
  `);
}
