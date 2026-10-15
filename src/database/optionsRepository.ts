import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { LabelOption, OptionKind } from '../types';
import { withWriteTransaction } from './transactions';

interface OptionRow {
  id: string;
  kind: OptionKind;
  translation_key: string | null;
  custom_label: string | null;
  legacy_value: string;
  sort_order: number;
  applies_to_all: number;
}

export async function getLabelOptions(
  db: SQLiteDatabase,
  kind?: OptionKind,
  includeDisabled = false,
): Promise<LabelOption[]> {
  const enabledClause = includeDisabled ? '' : 'AND enabled = 1';
  const rows = kind
    ? await db.getAllAsync<OptionRow>(
        `SELECT id, kind, translation_key, custom_label, legacy_value,
                sort_order, applies_to_all
         FROM label_options WHERE kind = ? ${enabledClause}
         ORDER BY sort_order, id`,
        kind,
      )
    : await db.getAllAsync<OptionRow>(
        `SELECT id, kind, translation_key, custom_label, legacy_value,
                sort_order, applies_to_all
         FROM label_options WHERE 1 = 1 ${enabledClause}
         ORDER BY kind, sort_order, id`,
      );
  return rows.map(mapOption);
}

export async function addLabelOption(
  db: SQLiteDatabase,
  kind: OptionKind,
  rawLabel: string,
): Promise<void> {
  const label = rawLabel.trim().replace(/\s+/g, ' ');
  const nextOrder = await db.getFirstAsync<{ next_order: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
     FROM label_options WHERE kind = ? AND enabled = 1`,
    kind,
  );
  const id = `${kind}-custom-${Crypto.randomUUID()}`;
  await db.runAsync(
    `INSERT INTO label_options
      (id, kind, translation_key, custom_label, legacy_value,
       sort_order, applies_to_all, enabled)
     VALUES (?, ?, NULL, ?, ?, ?, 1, 1)`,
    id,
    kind,
    label,
    id,
    nextOrder?.next_order ?? 0,
  );
}

export async function renameLabelOption(
  db: SQLiteDatabase,
  id: string,
  rawLabel: string,
): Promise<void> {
  const label = rawLabel.trim().replace(/\s+/g, ' ');
  await db.runAsync(
    `UPDATE label_options SET custom_label = ?, translation_key = NULL WHERE id = ?`,
    label,
    id,
  );
}

export async function removeLabelOption(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE label_options SET enabled = 0 WHERE id = ?', id);
}

export async function reorderLabelOption(
  db: SQLiteDatabase,
  kind: OptionKind,
  orderedIds: string[],
): Promise<void> {
  await withWriteTransaction(db, async (transaction) => {
    for (const [index, id] of orderedIds.entries()) {
      await transaction.runAsync(
        'UPDATE label_options SET sort_order = ? WHERE id = ? AND kind = ?',
        index,
        id,
        kind,
      );
    }
  });
}

function mapOption(row: OptionRow): LabelOption {
  return {
    id: row.id,
    kind: row.kind,
    translationKey: row.translation_key,
    customLabel: row.custom_label,
    legacyValue: row.legacy_value,
    sortOrder: row.sort_order,
    appliesToAll: row.applies_to_all === 1,
  };
}
