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
       package_expiry_date, manufacturer_days_after_open, product_photo_uri, photo_uri, confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    evidence.itemId,
    evidence.barcodeValue,
    evidence.barcodeFormat,
    evidence.gtin,
    evidence.lotCode,
    evidence.packageExpiryDate,
    evidence.manufacturerDaysAfterOpen,
    evidence.productPhotoUri,
    evidence.expiryPhotoUri,
    evidence.confirmedAt,
  );
  return { ...evidence, id: result.lastInsertRowId };
}

interface PackageEvidenceRow {
  id: number;
  item_id: string;
  barcode_value: string;
  barcode_format: string;
  gtin: string;
  lot_code: string;
  package_expiry_date: string;
  manufacturer_days_after_open: number | null;
  product_photo_uri: string;
  photo_uri: string;
  confirmed_at: string;
}

export async function getLatestPackageEvidenceForItem(
  db: SQLiteDatabase,
  itemId: string,
): Promise<PackageEvidence | null> {
  const row = await db.getFirstAsync<PackageEvidenceRow>(
    'SELECT * FROM package_scans WHERE item_id = ? ORDER BY confirmed_at DESC, id DESC LIMIT 1',
    itemId,
  );
  return row ? mapPackageEvidence(row) : null;
}

export async function getPackageEvidenceById(
  db: SQLiteDatabase,
  id: number,
): Promise<PackageEvidence | null> {
  const row = await db.getFirstAsync<PackageEvidenceRow>('SELECT * FROM package_scans WHERE id = ?', id);
  return row ? mapPackageEvidence(row) : null;
}

function mapPackageEvidence(row: PackageEvidenceRow): PackageEvidence {
  return {
    id: row.id,
    itemId: row.item_id,
    barcodeValue: row.barcode_value,
    barcodeFormat: row.barcode_format,
    gtin: row.gtin,
    lotCode: row.lot_code,
    packageExpiryDate: row.package_expiry_date,
    manufacturerDaysAfterOpen: row.manufacturer_days_after_open,
    productPhotoUri: row.product_photo_uri,
    expiryPhotoUri: row.photo_uri,
    confirmedAt: row.confirmed_at,
  };
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
