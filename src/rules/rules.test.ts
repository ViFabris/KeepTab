import { describe, expect, it } from 'vitest';

import { FOOD_SAFETY_RULES, getRule, getRulesForJurisdiction, RULES_VERSION } from './rules';

describe('food-safety rules data', () => {
  it('has unique IDs and complete bilingual/source metadata', () => {
    expect(new Set(FOOD_SAFETY_RULES.map((rule) => rule.id)).size).toBe(FOOD_SAFETY_RULES.length);
    for (const rule of FOOD_SAFETY_RULES) {
      expect(rule.title.en).not.toBe('');
      expect(rule.title['pt-BR']).not.toBe('');
      expect(rule.summary.en).not.toBe('');
      expect(rule.summary['pt-BR']).not.toBe('');
      expect(rule.appliesTo.en).not.toBe('');
      expect(rule.appliesTo['pt-BR']).not.toBe('');
      expect(rule.sources.length).toBeGreaterThan(0);
      expect(rule.reviewedOn).toBe('');
      expect(rule.reviewedBy).toBe('');
      expect(rule.rulesVersion).toBe(RULES_VERSION);
    }
  });

  it('stores the supplied RDC 218 rules and exact citations', () => {
    expect(['VEG-SAMEDAY', 'VEG-COLD', 'VEG-RECEIVING', 'VEG-VALIDITY', 'VEG-WASH'].map(getRule).map((rule) => rule.sources[0]?.itemNumber)).toEqual([
      '4.3.11; scope 1.2',
      '4.3.11; scope 1.2',
      '4.1.1, 4.1.4',
      '4.3.8',
      '4.3.9, 4.3.10',
    ]);
    expect(getRule('VEG-SAMEDAY').appliesTo.en).toContain('coconut water');
    expect(getRule('VEG-SAMEDAY').appliesTo.en).toContain('does not apply');
  });

  it('loads RS-only rules only for Rio Grande do Sul', () => {
    expect(getRulesForJurisdiction('OTHER').some((rule) => rule.id === 'COLD-3D')).toBe(false);
    expect(getRulesForJurisdiction('RS').some((rule) => rule.id === 'COLD-3D')).toBe(true);
    expect(getRulesForJurisdiction('OTHER').some((rule) => rule.id === 'COLD-5D')).toBe(true);
  });
});
