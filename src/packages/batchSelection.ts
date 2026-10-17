import type { PackageEvidence } from '../types';

export interface PackageBatchLimits {
  packageExpiryDate: string;
  manufacturerDaysAfterOpen: number | null;
  openedAt: string | null;
}

export function isPackageBatchExpired(batch: PackageEvidence, today: string): boolean {
  return Boolean(batch.packageExpiryDate && batch.packageExpiryDate < today);
}

export function sortPackageBatches(batches: PackageEvidence[]): PackageEvidence[] {
  return [...batches].sort((left, right) => {
    const expiry = comparableExpiry(left).localeCompare(comparableExpiry(right));
    if (expiry !== 0) return expiry;
    if (left.status !== right.status) return left.status === 'open' ? -1 : 1;
    return left.id - right.id;
  });
}

export function getRecommendedBatchId(
  batches: PackageEvidence[],
  today: string,
): number | null {
  return sortPackageBatches(batches)
    .find((batch) => batch.status !== 'used_up' && !isPackageBatchExpired(batch, today))?.id ?? null;
}

export function toggleBatchSelection(selectedIds: number[], id: number): number[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((candidate) => candidate !== id)
    : [...selectedIds, id];
}

export function getPackageBatchLimits(batches: PackageEvidence[]): PackageBatchLimits {
  const expiryDates = batches.map((batch) => batch.packageExpiryDate).filter(Boolean).sort();
  const openingPeriods = batches
    .map((batch) => batch.manufacturerDaysAfterOpen)
    .filter((days): days is number => typeof days === 'number' && days > 0);
  const openedDates = batches
    .map((batch) => batch.openedAt)
    .filter((date): date is string => Boolean(date))
    .sort();
  return {
    packageExpiryDate: expiryDates[0] ?? '',
    manufacturerDaysAfterOpen: openingPeriods.length ? Math.min(...openingPeriods) : null,
    openedAt: openedDates[0] ?? null,
  };
}

export function formRequiresOpening(legacyValues: string[]): boolean {
  return legacyValues.some((value) => ['Opened', 'Cut', 'Shredded', 'Peeled'].includes(value));
}

function comparableExpiry(batch: PackageEvidence): string {
  return batch.packageExpiryDate || '9999-12-31';
}
