import federalData from '../../data/rules/br-federal.json';
import rsData from '../../data/rules/br-rs.json';
import type { Jurisdiction, Language } from '../types';

export const RULES_VERSION = federalData.rulesVersion;

export interface FoodSafetyRule {
  id: string;
  jurisdiction: string;
  title: Record<Language, string>;
  summary: Record<Language, string>;
  exactNumbers: readonly string[];
  sources: readonly {
    law: string;
    itemNumber: string;
    sourceUrl: string;
  }[];
  enforced: boolean;
  enforcedIn: string;
  appliesTo: Record<Language, string>;
  reviewedOn: string;
  reviewedBy: string;
  rulesVersion: string;
}

export const FOOD_SAFETY_RULES = [
  ...federalData.rules,
  ...rsData.rules,
] as FoodSafetyRule[];

export function getRule(id: string): FoodSafetyRule {
  const rule = FOOD_SAFETY_RULES.find((candidate) => candidate.id === id);
  if (!rule) throw new Error(`UNKNOWN_RULE:${id}`);
  return rule;
}

export function getRulesForJurisdiction(jurisdiction: Jurisdiction): FoodSafetyRule[] {
  return FOOD_SAFETY_RULES.filter((rule) =>
    rule.jurisdiction === 'Federal' ||
    rule.jurisdiction === 'Federal + RS' ||
    (jurisdiction === 'RS' && rule.jurisdiction === 'RS'),
  );
}
