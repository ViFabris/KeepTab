import { describe, expect, it } from 'vitest';

import { isValidPin, sanitizePin } from './pinValidation';

describe('admin PIN validation', () => {
  it('strips pasted letters, symbols, and spaces and limits length', () => {
    expect(sanitizePin(' 1a2-3 4!567 ')).toBe('123456');
  });

  it('accepts only four to six digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });
});
