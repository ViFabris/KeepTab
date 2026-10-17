import type { VerificationMode, VerificationStatus } from '../types';
import type { ValidityResult } from './validity';

export type PrintingGateReason = 'invalidValidity' | 'unverifiedStrict';

export interface PrintingGateResult {
  allowed: boolean;
  requiresTestWarning: boolean;
  reason?: PrintingGateReason;
}

export interface PrintingEvidence {
  legalRule: boolean;
  confirmedPackage: boolean;
}

export function evaluatePrintingGate(
  validity: ValidityResult,
  itemStatus: VerificationStatus,
  mode: VerificationMode,
  evidence: PrintingEvidence = { legalRule: false, confirmedPackage: false },
): PrintingGateResult {
  if (!validity.allowed) {
    return { allowed: false, requiresTestWarning: false, reason: 'invalidValidity' };
  }
  const hasEvidence = itemStatus === 'verified' || evidence.legalRule || evidence.confirmedPackage;
  if (!hasEvidence && mode === 'strict') {
    return { allowed: false, requiresTestWarning: false, reason: 'unverifiedStrict' };
  }
  return {
    allowed: true,
    requiresTestWarning: !hasEvidence && mode === 'test',
  };
}
