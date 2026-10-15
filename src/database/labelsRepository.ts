import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  LabelStatus,
  PrintableLabel,
  SavedLabel,
  StorageType,
  TodayLabelGroups,
} from '../types';
import { addLocalDays, startOfLocalDay } from '../utils/dates';

interface LabelRow {
  id: number;
  item_id: string;
  item_name: string;
  form: string;
  storage_type: StorageType;
  made_at: string;
  use_by_at: string;
  staff_id: number | null;
  staff_name: string;
  status: LabelStatus;
  printed_at: string;
}

export async function savePrintedLabel(
  db: SQLiteDatabase,
  label: PrintableLabel,
  printedAt = new Date().toISOString(),
): Promise<SavedLabel> {
  const result = await db.runAsync(
    `INSERT INTO labels
      (item_id, item_name, form, storage_type, made_at, use_by_at,
       staff_id, staff_name, status, printed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    label.itemId,
    label.itemName,
    label.form,
    label.storageType,
    label.madeAt,
    label.useByAt,
    label.staffId,
    label.staffName,
    printedAt,
  );

  return {
    ...label,
    id: result.lastInsertRowId,
    status: 'active',
    printedAt,
  };
}

export async function getTodayLabelGroups(
  db: SQLiteDatabase,
  now = new Date(),
): Promise<TodayLabelGroups> {
  const tomorrow = addLocalDays(startOfLocalDay(now), 1);
  const endOfUpcomingWindow = addLocalDays(startOfLocalDay(now), 4);
  const rows = await db.getAllAsync<LabelRow>(
    `SELECT * FROM labels
     WHERE status = 'active' AND use_by_at < ?
     ORDER BY use_by_at ASC`,
    endOfUpcomingWindow.toISOString(),
  );

  const groups: TodayLabelGroups = { overdue: [], today: [], nextThreeDays: [] };
  for (const row of rows) {
    const label = mapLabelRow(row);
    const useBy = new Date(label.useByAt);
    if (useBy < now) {
      groups.overdue.push(label);
    } else if (useBy < tomorrow) {
      groups.today.push(label);
    } else {
      groups.nextThreeDays.push(label);
    }
  }
  return groups;
}

export async function updateLabelStatus(
  db: SQLiteDatabase,
  id: number,
  status: Exclude<LabelStatus, 'active'>,
): Promise<void> {
  await db.runAsync('UPDATE labels SET status = ? WHERE id = ?', status, id);
}

function mapLabelRow(row: LabelRow): SavedLabel {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    form: row.form,
    storageType: row.storage_type,
    madeAt: row.made_at,
    useByAt: row.use_by_at,
    staffId: row.staff_id,
    staffName: row.staff_name,
    status: row.status,
    printedAt: row.printed_at,
  };
}
