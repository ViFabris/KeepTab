import type { SQLiteDatabase } from 'expo-sqlite';

import sampleData from '../data/sample-data.json';
import type { StorageType } from '../types';
import { SCHEMA_SQL } from './schema';

const PLACEHOLDER_SOURCE_NOTE =
  'PLACEHOLDER SAMPLE DATA — NOT VERIFIED FOR FOOD SAFETY';

interface SeedOption<T extends string> {
  value: T;
  isDefault: boolean;
}

interface SeedShelfLife {
  form: string;
  storageType: StorageType;
  hours: number;
  placeholder: boolean;
}

interface SeedItem {
  id: string;
  name: string;
  storageOptions: SeedOption<StorageType>[];
  formOptions: SeedOption<string>[];
  shelfLives: SeedShelfLife[];
}

interface SeedData {
  _notice: string;
  seedVersion: number;
  staff: string[];
  items: SeedItem[];
}

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);

  const seed = sampleData as SeedData;
  const currentSeed = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    'seed_version',
  );

  if (Number(currentSeed?.value ?? 0) >= seed.seedVersion) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const item of seed.items) {
      await transaction.runAsync(
        'INSERT OR IGNORE INTO items (id, name) VALUES (?, ?)',
        item.id,
        item.name,
      );

      for (const [index, option] of item.storageOptions.entries()) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO item_storage_options
            (item_id, storage_type, sort_order, is_default)
           VALUES (?, ?, ?, ?)`,
          item.id,
          option.value,
          index,
          option.isDefault ? 1 : 0,
        );
      }

      for (const [index, option] of item.formOptions.entries()) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO item_form_options
            (item_id, form, sort_order, is_default)
           VALUES (?, ?, ?, ?)`,
          item.id,
          option.value,
          index,
          option.isDefault ? 1 : 0,
        );
      }

      for (const shelfLife of item.shelfLives) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO shelf_lives
            (item_id, form, storage_type, shelf_life_hours, is_placeholder, source_note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          item.id,
          shelfLife.form,
          shelfLife.storageType,
          shelfLife.hours,
          shelfLife.placeholder ? 1 : 0,
          PLACEHOLDER_SOURCE_NOTE,
        );
      }
    }

    const createdAt = new Date().toISOString();
    for (const name of seed.staff) {
      await transaction.runAsync(
        'INSERT OR IGNORE INTO staff (name, created_at) VALUES (?, ?)',
        name,
        createdAt,
      );
    }

    await transaction.runAsync(
      `INSERT INTO app_metadata (key, value) VALUES ('seed_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      String(seed.seedVersion),
    );
  });
}
