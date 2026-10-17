import type { SQLiteDatabase } from 'expo-sqlite';

import type { PackageEvidence } from '../types';

export type NewPackageEvidence = Omit<PackageEvidence, 'id'>;

export async function savePackageEvidence(
  db: SQLiteDatabase,
  evidence: NewPackageEvidence,
): Promise<PackageEvidence> {
  const result = await db.runAsync(
    `INSERT INTO package_scans
      (item_id, barcode_value, barcode_format, gtin, lot_code,
       package_expiry_date, manufacturer_days_after_open, photo_uri, confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    evidence.itemId,
    evidence.barcodeValue,
    evidence.barcodeFormat,
    evidence.gtin,
    evidence.lotCode,
    evidence.packageExpiryDate,
    evidence.manufacturerDaysAfterOpen,
    evidence.photoUri,
    evidence.confirmedAt,
  );
  return { ...evidence, id: result.lastInsertRowId };
}

export async function getLatestPackageProfile(
  db: SQLiteDatabase,
  gtin: string,
): Promise<Pick<PackageEvidence, 'manufacturerDaysAfterOpen'> | null> {
  const row = await db.getFirstAsync<{ manufacturer_days_after_open: number | null }>(
    `SELECT manufacturer_days_after_open FROM package_scans
     WHERE gtin = ? AND manufacturer_days_after_open IS NOT NULL
     ORDER BY confirmed_at DESC LIMIT 1`,
    gtin,
  );
  return row ? { manufacturerDaysAfterOpen: row.manufacturer_days_after_open } : null;
}
