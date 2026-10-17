import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  LabelStatus,
  PackageEvidence,
  PrintableLabel,
  SavedLabel,
  TodayLabelGroups,
} from '../types';
import { getPackageEvidenceById } from './packageScansRepository';
import { DEFAULT_TIME_ZONE, getZonedDayNumber } from '../utils/appClock';
import { withWriteTransaction } from './transactions';

interface LabelRow {
  id: number;
  item_id: string;
  item_name: string;
  form: string;
  form_option_id: string | null;
  storage_type: string;
  storage_option_id: string | null;
  made_at: string;
  use_by_at: string;
  staff_id: number | null;
  staff_name: string;
  status: LabelStatus;
  printed_at: string;
  label_width_mm: number;
  label_height_mm: number;
  jurisdictions_json: string;
  rules_version: string;
  capped_by_rule_id: string | null;
  item_verification_status: 'unverified' | 'verified';
  verification_mode: 'strict' | 'test';
  verification_basis: 'item-review' | 'legal-rule' | 'package-evidence' | 'test';
  printer_profile_json: string;
  app_version: string;
  package_scan_id: number | null;
  lot_code: string;
  product_barcode: string;
}

export async function savePrintedLabel(
  db: SQLiteDatabase,
  label: PrintableLabel,
  printedAt = new Date().toISOString(),
): Promise<SavedLabel> {
  const result = await db.runAsync(
    `INSERT INTO labels
      (item_id, item_name, form, form_option_id, storage_type, storage_option_id,
       made_at, use_by_at, staff_id, staff_name, status, printed_at,
       label_width_mm, label_height_mm, jurisdictions_json, rules_version,
       capped_by_rule_id, item_verification_status, verification_mode, verification_basis,
       printer_profile_json, app_version, package_scan_id, lot_code, product_barcode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    label.itemId,
    label.itemName,
    label.form,
    label.formOptionId,
    label.storageType,
    label.storageOptionId,
    label.madeAt,
    label.useByAt,
    label.staffId,
    label.staffName,
    printedAt,
    label.labelWidthMm,
    label.labelHeightMm,
    JSON.stringify(label.jurisdictions ?? []),
    label.rulesVersion ?? '',
    label.cappedByRuleId ?? null,
    label.itemVerificationStatus ?? 'unverified',
    label.verificationMode ?? 'strict',
    label.verificationBasis ?? 'test',
    JSON.stringify(label.printerProfileSnapshot ?? {}),
    label.appVersion ?? '',
    label.packageScanId ?? null,
    label.lotCode ?? '',
    label.productBarcode ?? '',
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
  timeZone = DEFAULT_TIME_ZONE,
): Promise<TodayLabelGroups> {
  const rows = await db.getAllAsync<LabelRow>(
    `SELECT * FROM labels
     WHERE status = 'active'
       AND NOT EXISTS (SELECT 1 FROM label_events WHERE label_events.label_id = labels.id)
     ORDER BY use_by_at ASC`,
  );

  const groups: TodayLabelGroups = { overdue: [], today: [], nextThreeDays: [] };
  const todayNumber = getZonedDayNumber(now, timeZone);
  for (const row of rows) {
    const label = mapLabelRow(row);
    const useBy = new Date(label.useByAt);
    if (useBy < now) {
      groups.overdue.push(label);
      continue;
    }
    const dayDistance = getZonedDayNumber(useBy, timeZone) - todayNumber;
    if (dayDistance === 0) {
      groups.today.push(label);
    } else if (dayDistance >= 1 && dayDistance <= 3) {
      groups.nextThreeDays.push(label);
    }
  }
  return groups;
}

export async function updateLabelStatus(
  db: SQLiteDatabase,
  id: number,
  status: Exclude<LabelStatus, 'active'>,
  personName: string,
  occurredAt = new Date().toISOString(),
): Promise<void> {
  await withWriteTransaction(db, async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO label_events (label_id, event_type, occurred_at, person_name)
       VALUES (?, ?, ?, ?)`,
      id,
      status,
      occurredAt,
      personName,
    );
  });
}

export interface AuditRecord {
  label: SavedLabel;
  packageEvidence: PackageEvidence | null;
  events: { eventType: string; occurredAt: string; personName: string }[];
}

export async function getAuditRecords(
  db: SQLiteDatabase,
  startIso: string,
  endIso: string,
): Promise<AuditRecord[]> {
  const rows = await db.getAllAsync<LabelRow>(
    `SELECT * FROM labels WHERE made_at >= ? AND made_at <= ? ORDER BY made_at, id`,
    startIso,
    endIso,
  );
  const records: AuditRecord[] = [];
  for (const row of rows) {
    const events = await db.getAllAsync<{ event_type: string; occurred_at: string; person_name: string }>(
      `SELECT event_type, occurred_at, person_name FROM label_events WHERE label_id = ? ORDER BY occurred_at`,
      row.id,
    );
    records.push({
      label: mapLabelRow(row),
      packageEvidence: row.package_scan_id
        ? await getPackageEvidenceById(db, row.package_scan_id)
        : null,
      events: events.map((event) => ({
        eventType: event.event_type,
        occurredAt: event.occurred_at,
        personName: event.person_name,
      })),
    });
  }
  return records;
}

function mapLabelRow(row: LabelRow): SavedLabel {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    form: row.form,
    formOptionId: row.form_option_id,
    storageType: row.storage_type,
    storageOptionId: row.storage_option_id,
    madeAt: row.made_at,
    useByAt: row.use_by_at,
    staffId: row.staff_id,
    staffName: row.staff_name,
    status: row.status,
    printedAt: row.printed_at,
    labelWidthMm: row.label_width_mm,
    labelHeightMm: row.label_height_mm,
    jurisdictions: parseJson<string[]>(row.jurisdictions_json, []),
    rulesVersion: row.rules_version,
    cappedByRuleId: row.capped_by_rule_id,
    itemVerificationStatus: row.item_verification_status,
    verificationMode: row.verification_mode,
    verificationBasis: row.verification_basis,
    printerProfileSnapshot: parseJson(row.printer_profile_json, undefined),
    appVersion: row.app_version,
    packageScanId: row.package_scan_id,
    lotCode: row.lot_code,
    productBarcode: row.product_barcode,
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
