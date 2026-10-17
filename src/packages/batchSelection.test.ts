import { describe, expect, it } from 'vitest';

import type { PackageEvidence } from '../types';
import {
  formRequiresOpening,
  findExactPackageBatch,
  getPackageBatchLimits,
  getRecommendedBatchId,
  sortPackageBatches,
  toggleBatchSelection,
} from './batchSelection';

function batch(overrides: Partial<PackageEvidence> = {}): PackageEvidence {
  return {
    id: 1,
    itemId: 'cheese',
    barcodeValue: '789',
    barcodeFormat: 'ean13',
    gtin: '789',
    lotCode: 'A',
    packageExpiryDate: '2026-11-01',
    manufacturerDaysAfterOpen: 7,
    productPhotoUri: 'product.jpg',
    expiryPhotoUri: 'expiry.jpg',
    confirmedAt: '2026-10-10T12:00:00.000Z',
    status: 'sealed',
    openedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe('package batch selection', () => {
  it('recommends the valid batch with the earliest manufacturer expiry', () => {
    expect(getRecommendedBatchId([
      batch({ id: 1, packageExpiryDate: '2026-11-01' }),
      batch({ id: 2, packageExpiryDate: '2026-10-20' }),
      batch({ id: 3, packageExpiryDate: '2026-10-15' }),
    ], '2026-10-16')).toBe(2);
  });

  it('sorts batches by expiry and keeps an open batch first on a tie', () => {
    expect(sortPackageBatches([
      batch({ id: 1 }),
      batch({ id: 2, status: 'open' }),
    ]).map(({ id }) => id)).toEqual([2, 1]);
  });

  it('allows selecting multiple batches and removing one independently', () => {
    expect(toggleBatchSelection(toggleBatchSelection([1], 2), 1)).toEqual([2]);
  });

  it('uses the earliest limit across combined batches', () => {
    expect(getPackageBatchLimits([
      batch({ packageExpiryDate: '2026-11-01', manufacturerDaysAfterOpen: 7, openedAt: '2026-10-16T12:00:00.000Z' }),
      batch({ id: 2, packageExpiryDate: '2026-10-25', manufacturerDaysAfterOpen: 5, openedAt: '2026-10-17T12:00:00.000Z' }),
    ])).toEqual({
      packageExpiryDate: '2026-10-25',
      manufacturerDaysAfterOpen: 5,
      openedAt: '2026-10-16T12:00:00.000Z',
    });
  });

  it('treats cutting, shredding, peeling, and opened packaging as opening the source package', () => {
    expect(formRequiresOpening(['Shredded', 'Unopened'])).toBe(true);
    expect(formRequiresOpening(['Whole', 'Unopened'])).toBe(false);
  });

  it('matches an exact active batch only when the scan includes its lot', () => {
    const batches = [batch({ id: 4, gtin: '07891234567890', lotCode: 'LOT42' })];
    expect(findExactPackageBatch(batches, {
      gtin: '07891234567890',
      lotCode: 'LOT42',
      rawValue: '(01)07891234567890(10)LOT42',
    })?.id).toBe(4);
    expect(findExactPackageBatch(batches, {
      gtin: '07891234567890',
      lotCode: null,
      rawValue: '07891234567890',
    })).toBeNull();
  });
});
