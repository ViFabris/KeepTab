import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

import type { ImportedItemRow } from '../import/itemsCsv';
import type { KitchenItem, LabelOption, PlantBasedType, ShelfLife, StorageType, VerificationStatus } from '../types';
import { getLabelOptions } from './optionsRepository';
import { withWriteTransaction } from './transactions';

interface ItemRow {
  id: string;
  name: string;
  plant_based_type: PlantBasedType;
  heat_treated: number;
  verification_status: VerificationStatus;
  verified_by: string;
  verified_on: string;
  manufacturer_days_after_open: number | null;
  source: string;
}

interface StorageRow {
  item_id: string;
  storage_type: StorageType;
  is_default: number;
}

interface FormRow {
  item_id: string;
  form: string;
  is_default: number;
  prepared_food: number;
}

export async function getItems(db: SQLiteDatabase): Promise<KitchenItem[]> {
  const [items, storageRows, formRows, allOptions] = await Promise.all([
    db.getAllAsync<ItemRow>(`SELECT id, name, plant_based_type, heat_treated,
      verification_status, verified_by, verified_on, manufacturer_days_after_open, source
      FROM items ORDER BY name COLLATE NOCASE`),
    db.getAllAsync<StorageRow>(
      `SELECT item_id, storage_type, is_default
       FROM item_storage_options ORDER BY item_id, sort_order`,
    ),
    db.getAllAsync<FormRow>(
      `SELECT item_id, form, is_default, prepared_food
       FROM item_form_options ORDER BY item_id, sort_order`,
    ),
    getLabelOptions(db),
  ]);

  const storageOptions = allOptions.filter((option) => option.kind === 'storage');
  const formOptions = allOptions.filter((option) => option.kind === 'form');

  return items.map((item) => {
    const itemStorageRows = storageRows.filter((row) => row.item_id === item.id);
    const itemFormRows = formRows.filter((row) => row.item_id === item.id);
    return {
      id: item.id,
      name: item.name,
      storageOptions: optionsForItem(storageOptions, itemStorageRows, 'storage_type'),
      formOptions: optionsForItem(formOptions, itemFormRows, 'form'),
      plantBasedType: item.plant_based_type,
      heatTreated: item.heat_treated === 1,
      verificationStatus: item.verification_status,
      verifiedBy: item.verified_by,
      verifiedOn: item.verified_on,
      manufacturerDaysAfterOpen: item.manufacturer_days_after_open,
      source: item.source,
    };
  });
}

export async function getShelfLife(
  db: SQLiteDatabase,
  itemId: string,
  formOptionId: string,
  storageOptionId: string,
): Promise<ShelfLife | null> {
  const [formOption, storageOption] = await Promise.all([
    db.getFirstAsync<{ legacy_value: string }>(
      `SELECT legacy_value FROM label_options WHERE id = ? AND kind = 'form'`,
      formOptionId,
    ),
    db.getFirstAsync<{ legacy_value: string }>(
      `SELECT legacy_value FROM label_options WHERE id = ? AND kind = 'storage'`,
      storageOptionId,
    ),
  ]);
  if (!formOption || !storageOption) return null;

  const row = await db.getFirstAsync<{
    shelf_life_hours: number;
    is_placeholder: number;
    source_note: string;
  }>(
    `SELECT shelf_life_hours, is_placeholder, source_note
     FROM shelf_lives
     WHERE item_id = ? AND form = ? AND storage_type = ?`,
    itemId,
    formOption.legacy_value,
    storageOption.legacy_value,
  );

  if (!row) {
    return null;
  }

  return {
    hours: row.shelf_life_hours,
    isPlaceholder: row.is_placeholder === 1,
    sourceNote: row.source_note,
  };
}

export async function importItemRows(
  db: SQLiteDatabase,
  rows: ImportedItemRow[],
): Promise<number> {
  await withWriteTransaction(db, async (transaction) => {
    for (const row of rows) {
      await transaction.runAsync(
        `INSERT INTO items
          (id, name, plant_based_type, heat_treated, verification_status,
           verified_by, verified_on, manufacturer_days_after_open, source)
         VALUES (?, ?, ?, ?, 'unverified', '', '', ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           plant_based_type = excluded.plant_based_type,
           heat_treated = excluded.heat_treated,
           verification_status = 'unverified',
           verified_by = '',
           verified_on = '',
           manufacturer_days_after_open = excluded.manufacturer_days_after_open,
           source = excluded.source`,
        row.itemId,
        row.itemName,
        row.plantBasedType,
        row.heatTreated ? 1 : 0,
        row.manufacturerDaysAfterOpen,
        row.source,
      );

      const storageOptionId = await ensureImportedOption(
        transaction,
        'storage',
        row.storageType,
        row.storageTemperatureClass,
      );
      const formOptionId = await ensureImportedOption(transaction, 'form', row.form);
      void storageOptionId;
      void formOptionId;

      await transaction.runAsync(
        `INSERT INTO item_storage_options (item_id, storage_type, sort_order, is_default)
         VALUES (?, ?, 0, 1)
         ON CONFLICT(item_id, storage_type) DO NOTHING`,
        row.itemId,
        row.storageType,
      );
      await transaction.runAsync(
        `INSERT INTO item_form_options (item_id, form, sort_order, is_default, prepared_food)
         VALUES (?, ?, 0, 1, ?)
         ON CONFLICT(item_id, form) DO UPDATE SET prepared_food = excluded.prepared_food`,
        row.itemId,
        row.form,
        row.preparedFood ? 1 : 0,
      );
      if (row.shelfLifeDays === null) {
        await transaction.runAsync(
          'DELETE FROM shelf_lives WHERE item_id = ? AND form = ? AND storage_type = ?',
          row.itemId,
          row.form,
          row.storageType,
        );
      } else {
        await transaction.runAsync(
          `INSERT INTO shelf_lives
            (item_id, form, storage_type, shelf_life_hours, is_placeholder, source_note)
           VALUES (?, ?, ?, ?, 0, ?)
           ON CONFLICT(item_id, form, storage_type) DO UPDATE SET
             shelf_life_hours = excluded.shelf_life_hours,
             is_placeholder = 0,
             source_note = excluded.source_note`,
          row.itemId,
          row.form,
          row.storageType,
          row.shelfLifeDays * 24,
          row.source,
        );
      }
    }
  });
  return rows.length;
}

export async function setItemVerification(
  db: SQLiteDatabase,
  itemId: string,
  verification: { status: VerificationStatus; reviewer?: string; reviewedOn?: string },
): Promise<void> {
  if (verification.status === 'verified' && (!verification.reviewer?.trim() || !verification.reviewedOn?.trim())) {
    throw new Error('VERIFICATION_REVIEW_REQUIRED');
  }
  await db.runAsync(
    `UPDATE items SET verification_status = ?, verified_by = ?, verified_on = ? WHERE id = ?`,
    verification.status,
    verification.status === 'verified' ? verification.reviewer?.trim() ?? '' : '',
    verification.status === 'verified' ? verification.reviewedOn?.trim() ?? '' : '',
    itemId,
  );
}

export async function updateItemSafety(
  db: SQLiteDatabase,
  itemId: string,
  values: Pick<KitchenItem, 'plantBasedType' | 'heatTreated' | 'manufacturerDaysAfterOpen' | 'source'>,
): Promise<void> {
  await db.runAsync(
    `UPDATE items SET plant_based_type = ?, heat_treated = ?,
      manufacturer_days_after_open = ?, source = ?,
      verification_status = 'unverified', verified_by = '', verified_on = ''
     WHERE id = ?`,
    values.plantBasedType,
    values.heatTreated ? 1 : 0,
    values.manufacturerDaysAfterOpen,
    values.source.trim(),
    itemId,
  );
}

async function ensureImportedOption(
  db: SQLiteDatabase,
  kind: 'storage' | 'form',
  value: string,
  temperatureClass?: ImportedItemRow['storageTemperatureClass'],
): Promise<string> {
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM label_options WHERE kind = ? AND legacy_value = ? COLLATE NOCASE LIMIT 1`,
    kind,
    value,
  );
  if (existing) {
    if (kind === 'storage') {
      await db.runAsync('UPDATE label_options SET temperature_class = ?, enabled = 1 WHERE id = ?', temperatureClass ?? null, existing.id);
    }
    return existing.id;
  }
  const id = `${kind}-import-${Crypto.randomUUID()}`;
  const order = await db.getFirstAsync<{ next_order: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM label_options WHERE kind = ?`,
    kind,
  );
  await db.runAsync(
    `INSERT INTO label_options
      (id, kind, translation_key, custom_label, legacy_value, sort_order, applies_to_all, temperature_class, enabled)
     VALUES (?, ?, NULL, ?, ?, ?, 0, ?, 1)`,
    id,
    kind,
    value,
    value,
    order?.next_order ?? 0,
    kind === 'storage' ? temperatureClass ?? null : null,
  );
  return id;
}

function optionsForItem<
  T extends { is_default: number } & ({ storage_type: StorageType } | { form: string }),
>(
  options: LabelOption[],
  mappings: T[],
  valueKey: 'storage_type' | 'form',
) {
  const applicable = options
    .filter(
      (option) =>
        option.appliesToAll ||
        mappings.some((mapping) => mapping[valueKey as keyof T] === option.legacyValue),
    )
    .map((option) => ({
      ...option,
      isDefault: mappings.some(
        (mapping) =>
          mapping[valueKey as keyof T] === option.legacyValue && mapping.is_default === 1,
      ),
      preparedFood: valueKey === 'form'
        ? (mappings.find((mapping) => mapping[valueKey as keyof T] === option.legacyValue) as T & { prepared_food?: number } | undefined)?.prepared_food === 1
        : undefined,
    }));
  return applicable.length
    ? applicable
    : options.map((option, index) => ({ ...option, isDefault: index === 0, preparedFood: valueKey === 'form' ? false : undefined }));
}
