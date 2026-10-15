import type { SQLiteDatabase } from 'expo-sqlite';

import type { KitchenItem, ShelfLife, StorageType } from '../types';

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
  const [items, storageRows, formRows] = await Promise.all([
    db.getAllAsync<ItemRow>('SELECT id, name FROM items ORDER BY name COLLATE NOCASE'),
    db.getAllAsync<StorageRow>(
      `SELECT item_id, storage_type, is_default
       FROM item_storage_options ORDER BY item_id, sort_order`,
    ),
    db.getAllAsync<FormRow>(
      `SELECT item_id, form, is_default
       FROM item_form_options ORDER BY item_id, sort_order`,
    ),
  ]);

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    storageOptions: storageRows
      .filter((row) => row.item_id === item.id)
      .map((row) => ({ value: row.storage_type, isDefault: row.is_default === 1 })),
    formOptions: formRows
      .filter((row) => row.item_id === item.id)
      .map((row) => ({ value: row.form, isDefault: row.is_default === 1 })),
  }));
}

export async function getShelfLife(
  db: SQLiteDatabase,
  itemId: string,
  form: string,
  storageType: StorageType,
): Promise<ShelfLife | null> {
  const row = await db.getFirstAsync<{
    shelf_life_hours: number;
    is_placeholder: number;
    source_note: string;
  }>(
    `SELECT shelf_life_hours, is_placeholder, source_note
     FROM shelf_lives
     WHERE item_id = ? AND form = ? AND storage_type = ?`,
    itemId,
    form,
    storageType,
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
