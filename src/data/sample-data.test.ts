import { describe, expect, it } from 'vitest';

import sampleData from './sample-data.json';

describe('placeholder sample data', () => {
  it('contains 15 searchable items', () => {
    expect(sampleData.items).toHaveLength(15);
  });

  it('marks every shelf-life value as placeholder data', () => {
    const shelfLives = sampleData.items.flatMap((item) => item.shelfLives);
    expect(shelfLives.length).toBeGreaterThan(0);
    expect(shelfLives.every((value) => value.placeholder)).toBe(true);
    expect(sampleData._notice).toContain('NOT VERIFIED FOR FOOD SAFETY');
  });

  it('keeps at least one allowed combination intentionally unconfigured', () => {
    const hasMissingCombination = sampleData.items.some((item) =>
      item.storageOptions.some((storage) =>
        item.formOptions.some(
          (form) =>
            !item.shelfLives.some(
              (shelfLife) =>
                shelfLife.form === form.value &&
                shelfLife.storageType === storage.value,
            ),
        ),
      ),
    );
    expect(hasMissingCombination).toBe(true);
  });
});
