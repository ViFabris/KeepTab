import { describe, expect, it } from 'vitest';

import { parseItemsCsv } from './itemsCsv';

const HEADER = 'item_id,item_name,form,storage_type,storage_temperature_class,shelf_life_days,prepared_food,status,verified_by,verified_on,manufacturer_days_after_open,source,plant_based_type,heat_treated';

describe('item CSV import validation', () => {
  it('accepts the existing columns and applies safe defaults', () => {
    const report = parseItemsCsv('item_id,item_name,form,storage_type,shelf_life_days\nrice,Rice,Cooked,Refrigerated,3');
    expect(report.rejected).toEqual([]);
    expect(report.accepted[0]).toMatchObject({
      shelfLifeDays: 3,
      preparedFood: true,
      storageTemperatureClass: 'refrigerated',
      plantBasedType: 'none',
      heatTreated: false,
    });
  });

  it('accepts a blank shelf life as not printable', () => {
    const report = parseItemsCsv(`${HEADER}\njuice,Juice,Other,Refrigerated,refrigerated,,sim,unverified,,,,recipe,drink,não`);
    expect(report.accepted[0]?.shelfLifeDays).toBeNull();
  });

  it.each([
    ['shelf_life_days', '2.5', 'invalidShelfLife'],
    ['prepared_food', 'yes', 'invalidPreparedFood'],
    ['status', 'approved', 'invalidStatus'],
    ['storage_temperature_class', 'cool', 'invalidTemperatureClass'],
    ['plant_based_type', 'juice', 'invalidPlantBasedType'],
    ['heat_treated', 'no', 'invalidHeatTreated'],
  ])('rejects invalid %s values', (column, value, reason) => {
    const values = ['x', 'X', 'Other', 'Refrigerated', 'refrigerated', '2', 'sim', 'unverified', '', '', '', '', 'none', 'não'];
    values[HEADER.split(',').indexOf(column)] = value;
    const report = parseItemsCsv(`${HEADER}\n${values.join(',')}`);
    expect(report.rejected[0]?.reason).toBe(reason);
  });

  it('requires a temperature class for a custom storage type', () => {
    const report = parseItemsCsv('item_id,item_name,form,storage_type,shelf_life_days\nx,X,Other,Room temperature,2');
    expect(report.rejected[0]?.reason).toBe('missingTemperatureClass');
  });
});
