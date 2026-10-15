import { describe, expect, it } from 'vitest';

import { getFormLabel, getItemName, getStorageLabel } from './index';

describe('Brazilian Portuguese localization', () => {
  it('translates canonical item, form, and storage values', () => {
    expect(getItemName('cucumber', 'Cucumber', 'pt-BR')).toBe('Pepino');
    expect(getFormLabel('Cooked', 'pt-BR')).toBe('Cozido');
    expect(getStorageLabel('Frozen', 'pt-BR')).toBe('Congelado');
  });

  it('keeps canonical English values in English', () => {
    expect(getItemName('cucumber', 'Cucumber', 'en')).toBe('Cucumber');
    expect(getFormLabel('Cooked', 'en')).toBe('Cooked');
    expect(getStorageLabel('Frozen', 'en')).toBe('Frozen');
  });
});
