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

  it('never prints an invalid validity result in either mode', () => {
    expect(evaluatePrintingGate(INVALID, 'verified', 'strict').allowed).toBe(false);
    expect(evaluatePrintingGate(INVALID, 'unverified', 'test').allowed).toBe(false);
  });
});
