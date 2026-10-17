import type { VerificationMode, VerificationStatus } from '../types';
import type { ValidityResult } from './validity';

export type PrintingGateReason = 'invalidValidity' | 'unverifiedStrict';

export interface PrintingGateResult {
  allowed: boolean;
  requiresTestWarning: boolean;
  reason?: PrintingGateReason;
}

export function evaluatePrintingGate(
  validity: ValidityResult,
  itemStatus: VerificationStatus,
  mode: VerificationMode,
): PrintingGateResult {
  if (!validity.allowed) {
    return { allowed: false, requiresTestWarning: false, reason: 'invalidValidity' };
  }
  if (itemStatus !== 'verified' && mode === 'strict') {
    return { allowed: false, requiresTestWarning: false, reason: 'unverifiedStrict' };
  }
  return {
    allowed: true,
    requiresTestWarning: itemStatus !== 'verified' && mode === 'test',
  };
}
