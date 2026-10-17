import { describe, expect, it } from 'vitest';

import { FROZEN_GUIDANCE, guidanceRequiresExactChoice, REFRIGERATED_GUIDANCE, SHELF_LIFE_GUIDANCE } from './shelfLifeGuidance';

describe('user-supplied shelf-life guidance', () => {
  it('is stored as unverified, non-automatic data', () => {
    expect(SHELF_LIFE_GUIDANCE.status).toBe('unverified');
    expect(SHELF_LIFE_GUIDANCE.automatic).toBe(false);
  });

  it('preserves all supplied refrigerated categories and frozen bands', () => {
    expect(REFRIGERATED_GUIDANCE).toHaveLength(6);
    expect(FROZEN_GUIDANCE).toHaveLength(4);
  });

  it('does not collapse ambiguous ranges into an invented exact value', () => {
    expect(guidanceRequiresExactChoice(REFRIGERATED_GUIDANCE.find((entry) => entry.id === 'GUIDE-HOMEMADE-MAYO-SAUCE')!)).toBe(true);
    expect(guidanceRequiresExactChoice(REFRIGERATED_GUIDANCE.find((entry) => entry.id === 'GUIDE-OPENED-CANS')!)).toBe(true);
  });
});
