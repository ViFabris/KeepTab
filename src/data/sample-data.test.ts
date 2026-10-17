import { describe, expect, it } from 'vitest';

import sampleData from './sample-data.json';

describe('kitchen-managed catalog seed', () => {
  it('starts without pre-registered items or placeholder staff', () => {
    expect(sampleData.items).toEqual([]);
    expect(sampleData.staff).toEqual([]);
  });

  it('documents that items are registered by the kitchen', () => {
    expect(sampleData._notice).toContain('kitchen-managed');
    expect(sampleData.seedVersion).toBeGreaterThanOrEqual(4);
  });
});
