import { describe, expect, it } from 'vitest';

import type { KitchenItem } from '../types';
import { filterItems } from '../utils/itemSearch';

const items: KitchenItem[] = [
  item('cucumber', 'Cucumber'),
  item('rice', 'Rice'),
];

function item(id: string, name: string): KitchenItem {
  return {
    id,
    name,
    storageOptions: [],
    formOptions: [],
    plantBasedType: 'none',
    heatTreated: false,
    verificationStatus: 'unverified',
    verifiedBy: '',
    verifiedOn: '',
    manufacturerDaysAfterOpen: null,
    source: '',
  };
}

describe('item search', () => {
  it('matches item names without case sensitivity', () => {
    expect(filterItems(items, 'CUC')).toEqual([items[0]]);
  });

  it('shows all suggestions for an empty query', () => {
    expect(filterItems(items, '  ')).toEqual(items);
  });

  it('searches the Brazilian Portuguese item name', () => {
    expect(filterItems(items, 'pepino', 'pt-BR')).toEqual([items[0]]);
  });
});
