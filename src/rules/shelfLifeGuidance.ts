import guidanceData from '../../data/rules/shelf-life-guidance.json';
import type { Language } from '../types';

export interface ShelfLifeGuidanceEntry {
  id: string;
  category?: Record<Language, string>;
  examples?: Record<Language, string>;
  temperatureText: Record<Language, string>;
  minimumDays: number;
  maximumDays: number;
  wording: Record<Language, string>;
  sourceType: string;
  sourceUrl: string;
  relatedRuleIds: string[];
}

export const SHELF_LIFE_GUIDANCE = guidanceData;
export const REFRIGERATED_GUIDANCE = guidanceData.refrigerated as ShelfLifeGuidanceEntry[];
export const FROZEN_GUIDANCE = guidanceData.frozen as ShelfLifeGuidanceEntry[];

export function guidanceRequiresExactChoice(entry: ShelfLifeGuidanceEntry): boolean {
  return entry.minimumDays !== entry.maximumDays;
}
