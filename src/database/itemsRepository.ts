import type { SQLiteDatabase } from 'expo-sqlite';

import type { KitchenItem, LabelOption, ShelfLife, StorageType } from '../types';
import { getLabelOptions } from './optionsRepository';

interface ItemRow {
  id: string;
  name: string;
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
}

export async function getItems(db: SQLiteDatabase): Promise<KitchenItem[]> {
  const [items, storageRows, formRows, allOptions] = await Promise.all([
    db.getAllAsync<ItemRow>('SELECT id, name FROM items ORDER BY name COLLATE NOCASE'),
    db.getAllAsync<StorageRow>(
      `SELECT item_id, storage_type, is_default
       FROM item_storage_options ORDER BY item_id, sort_order`,
    ),
    db.getAllAsync<FormRow>(
      `SELECT item_id, form, is_default
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
    }));
  return applicable.length
    ? applicable
    : options.map((option, index) => ({ ...option, isDefault: index === 0 }));
}
