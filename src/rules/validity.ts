import type { Jurisdiction, PlantBasedType, TemperatureClass } from '../types';
import { getZonedDateTimeParts, zonedDateTimeToInstant } from '../utils/appClock';
import { getRule } from './rules';

export type ValidityBlockReason =
  | 'ambientPlantPreparation'
  | 'missingManufacturerDays'
  | 'missingShelfLife';

export interface ValidityInput {
  madeAt: Date;
  timeZone: string;
  shelfLifeDays: number | null;
  preparedFood: boolean;
  opened: boolean;
  storageTemperatureClass: TemperatureClass;
  jurisdiction: Jurisdiction;
  fridgeAtOrBelow4C: boolean;
  reducedMaximumDays: number;
  plantBasedType: PlantBasedType;
  heatTreated: boolean;
  manufacturerDaysAfterOpen: number | null;
  packageExpiryAt?: Date | null;
}

export interface AppliedRule {
  ruleId: string;
  law: string;
  itemNumber: string;
  limitDays: number | null;
}

export type ValidityResult =
  | { allowed: false; reason: ValidityBlockReason; rule?: AppliedRule }
  | { allowed: true; expiresAt: Date; cappedBy: AppliedRule | null };

export function calculateValidity(input: ValidityInput): ValidityResult {
  const inPlantScope = input.plantBasedType !== 'none' && !input.heatTreated;
  if (inPlantScope && input.storageTemperatureClass === 'ambient') {
    return { allowed: false, reason: 'ambientPlantPreparation', rule: appliedRule('VEG-COLD', null) };
  }

  if (input.opened) {
    if (!input.manufacturerDaysAfterOpen) {
      return { allowed: false, reason: 'missingManufacturerDays' };
    }
    let expiresAt = addDays(input.madeAt, input.manufacturerDaysAfterOpen);
    if (input.packageExpiryAt && input.packageExpiryAt < expiresAt) {
      expiresAt = input.packageExpiryAt;
    }
    return { allowed: true, expiresAt, cappedBy: null };
  }

  if (!input.shelfLifeDays) {
    return { allowed: false, reason: 'missingShelfLife' };
  }

  let expiresAt = addDays(input.madeAt, input.shelfLifeDays);
  let cappedBy: AppliedRule | null = null;
  const applyCap = (days: number, ruleId: string) => {
    const candidate = addDays(input.madeAt, days);
    if (candidate <= expiresAt) {
      expiresAt = candidate;
      cappedBy = appliedRule(ruleId, days);
    }
  };

  if (input.preparedFood) {
    if (input.storageTemperatureClass === 'refrigerated') {
      applyCap(input.fridgeAtOrBelow4C ? 5 : input.reducedMaximumDays, 'COLD-5D');
      if (input.jurisdiction === 'RS') applyCap(3, 'COLD-3D');
    } else if (input.storageTemperatureClass === 'frozen' && input.jurisdiction === 'RS') {
      applyCap(90, 'FROZEN-90D');
    }
  }

  if (input.plantBasedType === 'drink' && !input.heatTreated) {
    const sameDay = endOfPreparationDay(input.madeAt, input.timeZone);
    if (sameDay < expiresAt) {
      expiresAt = sameDay;
      cappedBy = appliedRule('VEG-SAMEDAY', null);
    }
  }

  if (input.packageExpiryAt && input.packageExpiryAt < expiresAt) {
    expiresAt = input.packageExpiryAt;
  }

  return { allowed: true, expiresAt, cappedBy };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function endOfPreparationDay(date: Date, timeZone: string): Date {
  const parts = getZonedDateTimeParts(date, timeZone);
  return zonedDateTimeToInstant({ ...parts, hour: 23, minute: 59, second: 0 }, timeZone) ?? date;
}

function appliedRule(ruleId: string, limitDays: number | null): AppliedRule {
  const rule = getRule(ruleId);
  const source = rule.sources[0];
  if (!source) throw new Error(`RULE_WITHOUT_SOURCE:${ruleId}`);
  return { ruleId, law: source.law, itemNumber: source.itemNumber, limitDays };
}
