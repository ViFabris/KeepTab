export type PackageEvidenceValidationError =
  | 'productIdentityRequired'
  | 'expiryPhotoRequired'
  | 'expiryRequired'
  | 'expiryInvalid'
  | 'manufacturerDaysRequired';

export interface PackageEvidenceDraft {
  barcodeValue: string;
  productPhotoUri: string;
  expiryPhotoUri: string;
  expiryDate: string;
  manufacturerDays: string;
  requireManufacturerDays: boolean;
}

export function validatePackageEvidence(
  draft: PackageEvidenceDraft,
): PackageEvidenceValidationError | null {
  if (!draft.barcodeValue.trim() && !draft.productPhotoUri) return 'productIdentityRequired';
  if (!draft.expiryPhotoUri) return 'expiryPhotoRequired';
  if (!draft.expiryDate.trim()) return 'expiryRequired';
  if (!isValidIsoDate(draft.expiryDate)) return 'expiryInvalid';
  if (draft.requireManufacturerDays) {
    const days = Number(draft.manufacturerDays);
    if (!Number.isInteger(days) || days <= 0) return 'manufacturerDaysRequired';
  }
  return null;
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
