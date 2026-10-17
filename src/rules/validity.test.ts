import { describe, expect, it } from 'vitest';

import type { ValidityInput } from './validity';
import { calculateValidity } from './validity';

const BASE: ValidityInput = {
  madeAt: new Date('2026-10-16T15:00:00.000Z'),
  timeZone: 'America/Sao_Paulo',
  shelfLifeDays: 10,
  preparedFood: true,
  opened: false,
  storageTemperatureClass: 'refrigerated',
  jurisdiction: 'RS',
  fridgeAtOrBelow4C: true,
  reducedMaximumDays: 3,
  plantBasedType: 'none',
  heatTreated: false,
  manufacturerDaysAfterOpen: null,
};

function allowed(input: Partial<ValidityInput> = {}) {
  const result = calculateValidity({ ...BASE, ...input });
  if (!result.allowed) throw new Error(`unexpected block: ${result.reason}`);
  return result;
}

describe('food-safety validity calculation', () => {
  it('applies the federal five-day refrigerated cap at 4°C or below', () => {
    const result = allowed({ jurisdiction: 'OTHER' });
    expect(result.expiresAt.toISOString()).toBe('2026-10-21T15:00:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('COLD-5D');
  });

  it('uses the configured reduced federal maximum above 4°C', () => {
    const result = allowed({ jurisdiction: 'OTHER', fridgeAtOrBelow4C: false, reducedMaximumDays: 2 });
    expect(result.expiresAt.toISOString()).toBe('2026-10-18T15:00:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('COLD-5D');
  });

  it('uses the strictest cap in RS', () => {
    const result = allowed();
    expect(result.expiresAt.toISOString()).toBe('2026-10-19T15:00:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('COLD-3D');
  });

  it('applies the RS 90-day frozen cap', () => {
    const result = allowed({ shelfLifeDays: 120, storageTemperatureClass: 'frozen' });
    expect(result.cappedBy?.ruleId).toBe('FROZEN-90D');
    expect(result.expiresAt.toISOString()).toBe('2027-01-14T15:00:00.000Z');
  });

  it('does not apply day caps to opened products and honors package expiry', () => {
    const result = allowed({
      opened: true,
      manufacturerDaysAfterOpen: 14,
      packageExpiryAt: new Date('2026-10-20T12:00:00.000Z'),
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-20T12:00:00.000Z');
    expect(result.cappedBy).toBeNull();
  });

  it('calculates an opened product from the recorded batch opening time', () => {
    const result = allowed({
      madeAt: new Date('2026-10-18T15:00:00.000Z'),
      opened: true,
      openedAt: new Date('2026-10-16T15:00:00.000Z'),
      manufacturerDaysAfterOpen: 3,
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-19T15:00:00.000Z');
  });

  it('never prints a non-opened label past the confirmed package expiry', () => {
    const result = allowed({
      preparedFood: false,
      packageExpiryAt: new Date('2026-10-18T02:59:00.000Z'),
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-18T02:59:00.000Z');
  });

  it('blocks opened products without manufacturer days', () => {
    expect(calculateValidity({ ...BASE, opened: true }).allowed).toBe(false);
  });

  it('blocks combinations without a shelf life', () => {
    expect(calculateValidity({ ...BASE, shelfLifeDays: null, preparedFood: false })).toEqual({
      allowed: false,
      reason: 'missingShelfLife',
    });
  });

  it('derives three days directly from Portaria 799 for RS prepared refrigerated food', () => {
    const result = allowed({ shelfLifeDays: null });
    expect(result.expiresAt.toISOString()).toBe('2026-10-19T15:00:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('COLD-3D');
  });

  it('derives 90 days directly from Portaria 799 for RS prepared frozen food', () => {
    const result = allowed({ shelfLifeDays: null, storageTemperatureClass: 'frozen' });
    expect(result.expiresAt.toISOString()).toBe('2027-01-14T15:00:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('FROZEN-90D');
  });

  it('accepts confirmed package expiry as the sole limit for non-prepared food', () => {
    const result = allowed({
      shelfLifeDays: null,
      preparedFood: false,
      packageExpiryAt: new Date('2026-10-18T02:59:00.000Z'),
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-18T02:59:00.000Z');
    expect(result.cappedBy).toBeNull();
  });

  it('expires a plant drink prepared at 23:30 at 23:59 on the same local day', () => {
    const result = allowed({
      madeAt: new Date('2026-10-17T02:30:00.000Z'),
      plantBasedType: 'drink',
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-17T02:59:00.000Z');
    expect(result.cappedBy?.ruleId).toBe('VEG-SAMEDAY');
  });

  it('same-day beats the RS cap', () => {
    expect(allowed({ plantBasedType: 'drink' }).cappedBy?.ruleId).toBe('VEG-SAMEDAY');
  });

  it('a plant-based food in RS keeps the three-day cap', () => {
    expect(allowed({ plantBasedType: 'food' }).cappedBy?.ruleId).toBe('COLD-3D');
  });

  it('blocks ambient storage for in-scope non-heat-treated items', () => {
    const result = calculateValidity({ ...BASE, plantBasedType: 'food', storageTemperatureClass: 'ambient' });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.rule?.ruleId).toBe('VEG-COLD');
  });

  it('does not apply plant rules to heat-treated items', () => {
    const result = allowed({ plantBasedType: 'drink', heatTreated: true });
    expect(result.cappedBy?.ruleId).toBe('COLD-3D');
  });

  it('uses the selected timezone across a midnight boundary', () => {
    const result = allowed({
      madeAt: new Date('2026-10-16T23:30:00.000Z'),
      timeZone: 'Asia/Tokyo',
      plantBasedType: 'drink',
    });
    expect(result.expiresAt.toISOString()).toBe('2026-10-17T14:59:00.000Z');
  });
});
