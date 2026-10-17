import { describe, expect, it } from 'vitest';

import { evaluatePrintingGate } from './printingGate';

const VALID = { allowed: true as const, expiresAt: new Date(), cappedBy: null };
const INVALID = { allowed: false as const, reason: 'missingShelfLife' as const };

describe('printing gate', () => {
  it('allows verified items in strict mode', () => {
    expect(evaluatePrintingGate(VALID, 'verified', 'strict').allowed).toBe(true);
  });

  it('blocks unverified items in strict mode', () => {
    expect(evaluatePrintingGate(VALID, 'unverified', 'strict')).toMatchObject({
      allowed: false,
      reason: 'unverifiedStrict',
    });
  });

  it('requires a warning for unverified items in test mode', () => {
    expect(evaluatePrintingGate(VALID, 'unverified', 'test')).toMatchObject({
      allowed: true,
      requiresTestWarning: true,
    });
  });

  it('allows an unverified item when the selected combination is directly limited by law', () => {
    expect(evaluatePrintingGate(VALID, 'unverified', 'strict', {
      legalRule: true,
      confirmedPackage: false,
    })).toMatchObject({ allowed: true, requiresTestWarning: false });
  });

  it('allows an unverified packaged item after package evidence is confirmed', () => {
    expect(evaluatePrintingGate(VALID, 'unverified', 'strict', {
      legalRule: false,
      confirmedPackage: true,
    })).toMatchObject({ allowed: true, requiresTestWarning: false });
  });

  it('never prints an invalid validity result in either mode', () => {
    expect(evaluatePrintingGate(INVALID, 'verified', 'strict').allowed).toBe(false);
    expect(evaluatePrintingGate(INVALID, 'unverified', 'test').allowed).toBe(false);
  });
});
