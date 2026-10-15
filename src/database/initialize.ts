import type { SQLiteDatabase } from 'expo-sqlite';

import sampleData from '../data/sample-data.json';
import type { StorageType } from '../types';
import { migrateDatabase } from './migrations';
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
  sourceNote?: string;
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
  await migrateDatabase(db);

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
        `INSERT INTO items (id, name) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
        item.id,
        item.name,
      );

      for (const [index, option] of item.storageOptions.entries()) {
        await transaction.runAsync(
          `INSERT INTO item_storage_options
            (item_id, storage_type, sort_order, is_default)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(item_id, storage_type) DO UPDATE SET
             sort_order = excluded.sort_order,
             is_default = excluded.is_default`,
          item.id,
          option.value,
          index,
          option.isDefault ? 1 : 0,
        );
      }

      for (const [index, option] of item.formOptions.entries()) {
        await transaction.runAsync(
          `INSERT INTO item_form_options
            (item_id, form, sort_order, is_default)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(item_id, form) DO UPDATE SET
             sort_order = excluded.sort_order,
             is_default = excluded.is_default`,
          item.id,
          option.value,
          index,
          option.isDefault ? 1 : 0,
        );
      }

      for (const shelfLife of item.shelfLives) {
        const sourceNote = shelfLife.placeholder
          ? PLACEHOLDER_SOURCE_NOTE
          : shelfLife.sourceNote;
        if (!sourceNote) {
          throw new Error(
            `A non-placeholder shelf life for ${item.id}/${shelfLife.form}/${shelfLife.storageType} requires a sourceNote.`,
          );
        }
        await transaction.runAsync(
          `INSERT INTO shelf_lives
            (item_id, form, storage_type, shelf_life_hours, is_placeholder, source_note)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(item_id, form, storage_type) DO UPDATE SET
             shelf_life_hours = excluded.shelf_life_hours,
             is_placeholder = excluded.is_placeholder,
             source_note = excluded.source_note`,
          item.id,
          shelfLife.form,
          shelfLife.storageType,
          shelfLife.hours,
          shelfLife.placeholder ? 1 : 0,
          sourceNote,
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
