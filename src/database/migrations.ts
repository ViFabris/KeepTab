import type { SQLiteDatabase } from 'expo-sqlite';

import { findNearestLabelTemplate } from '../printing/labelTemplates';
import { withWriteTransaction } from './transactions';

interface TableColumn {
  name: string;
}

const DEFAULT_OPTIONS = [
  ['storage-refrigerated', 'storage', 'storage.refrigerated', 'Refrigerated', 0, 0],
  ['storage-frozen', 'storage', 'storage.frozen', 'Frozen', 1, 0],
  ['form-whole', 'form', 'form.whole', 'Whole', 0, 0],
  ['form-cut', 'form', 'form.cut', 'Cut', 1, 0],
  ['form-other', 'form', 'form.other', 'Other', 2, 1],
  ['form-cooked', 'form', 'form.cooked', 'Cooked', 3, 0],
  ['form-raw', 'form', 'form.raw', 'Raw', 4, 0],
  ['form-in-shell', 'form', 'form.inShell', 'In shell', 5, 0],
  ['form-peeled', 'form', 'form.peeled', 'Peeled', 6, 0],
  ['form-opened', 'form', 'form.opened', 'Opened', 7, 0],
  ['form-unopened', 'form', 'form.unopened', 'Unopened', 8, 0],
  ['form-shredded', 'form', 'form.shredded', 'Shredded', 9, 0],
] as const;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await seedDefaultOptions(db);
  await migrateLabelsTable(db);
  await migrateClockSettings(db);
  await initializeSettings(db);
  await migrateLabelSizeSetting(db);
  await linkExistingLabelsToOptions(db);
  await db.execAsync('PRAGMA user_version = 4');
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
          (id, kind, translation_key, custom_label, legacy_value, sort_order, applies_to_all, enabled)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 1)`,
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
       time_zone, clock_offset_ms, label_width_mm, label_height_mm, setup_complete)
     VALUES (1, ?, ?, ?, 1, 'America/Sao_Paulo', 0, 60, 40, 0)`,
    language,
    dateOrder,
    timeFormat,
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
