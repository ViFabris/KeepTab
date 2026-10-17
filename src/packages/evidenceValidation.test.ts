import { describe, expect, it } from 'vitest';

import { validatePackageEvidence } from './evidenceValidation';

const validDraft = {
  barcodeValue: '7891234567890',
  productPhotoUri: '',
  expiryPhotoUri: 'file:///expiry.jpg',
  expiryDate: '2027-12-31',
  manufacturerDays: '',
  requireManufacturerDays: false,
};

describe('package evidence validation', () => {
  it('accepts a barcode plus a separate expiry photo', () => {
    expect(validatePackageEvidence(validDraft)).toBeNull();
  });

  it('accepts a product photo instead of a barcode', () => {
    expect(validatePackageEvidence({
      ...validDraft,
      barcodeValue: '',
      productPhotoUri: 'file:///product.jpg',
    })).toBeNull();
  });

  it('requires either a barcode or a product-identification photo', () => {
    expect(validatePackageEvidence({ ...validDraft, barcodeValue: '' })).toBe('productIdentityRequired');
  });

  it('always requires a separate expiry photo and valid typed date', () => {
    expect(validatePackageEvidence({ ...validDraft, expiryPhotoUri: '' })).toBe('expiryPhotoRequired');
    expect(validatePackageEvidence({ ...validDraft, expiryDate: '' })).toBe('expiryRequired');
    expect(validatePackageEvidence({ ...validDraft, expiryDate: '2027-02-30' })).toBe('expiryInvalid');
  });

  it('requires manufacturer after-opening days for an opened product', () => {
    expect(validatePackageEvidence({
      ...validDraft,
      requireManufacturerDays: true,
    })).toBe('manufacturerDaysRequired');
    expect(validatePackageEvidence({
      ...validDraft,
      manufacturerDays: '7',
      requireManufacturerDays: true,
    })).toBeNull();
  });
});
