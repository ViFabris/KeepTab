import type { PlantBasedType, TemperatureClass } from '../types';

export const ITEM_CSV_COLUMNS = [
  'item_id',
  'item_name',
  'form',
  'storage_type',
  'storage_temperature_class',
  'shelf_life_days',
  'prepared_food',
  'status',
  'verified_by',
  'verified_on',
  'manufacturer_days_after_open',
  'source',
  'plant_based_type',
  'heat_treated',
] as const;

export type ImportRejectionReason =
  | 'invalidCsv'
  | 'missingRequiredValue'
  | 'invalidShelfLife'
  | 'invalidPreparedFood'
  | 'invalidStatus'
  | 'invalidTemperatureClass'
  | 'missingTemperatureClass'
  | 'invalidManufacturerDays'
  | 'invalidPlantBasedType'
  | 'invalidHeatTreated';

export interface ImportedItemRow {
  rowNumber: number;
  itemId: string;
  itemName: string;
  form: string;
  storageType: string;
  storageTemperatureClass: TemperatureClass;
  shelfLifeDays: number | null;
  preparedFood: boolean;
  manufacturerDaysAfterOpen: number | null;
  source: string;
  plantBasedType: PlantBasedType;
  heatTreated: boolean;
}

export interface ImportRejection {
  rowNumber: number;
  reason: ImportRejectionReason;
  value?: string;
}

export interface ItemsCsvImportReport {
  accepted: ImportedItemRow[];
  rejected: ImportRejection[];
}

export function parseItemsCsv(source: string): ItemsCsvImportReport {
  let records: string[][];
  try {
    records = parseCsv(source);
  } catch {
    return { accepted: [], rejected: [{ rowNumber: 1, reason: 'invalidCsv' }] };
  }
  const header = records[0]?.map((value) => value.trim()) ?? [];
  const index = new Map(header.map((name, position) => [name, position]));
  const required = ['item_id', 'item_name', 'form', 'storage_type'];
  if (required.some((name) => !index.has(name))) {
    return { accepted: [], rejected: [{ rowNumber: 1, reason: 'missingRequiredValue' }] };
  }

  const accepted: ImportedItemRow[] = [];
  const rejected: ImportRejection[] = [];
  for (let position = 1; position < records.length; position += 1) {
    const record = records[position];
    if (!record || record.every((value) => !value.trim())) continue;
    const rowNumber = position + 1;
    const get = (name: string) => record[index.get(name) ?? -1]?.trim() ?? '';
    const itemId = get('item_id');
    const itemName = get('item_name');
    const form = get('form');
    const storageType = get('storage_type');
    if (!itemId || !itemName || !form || !storageType) {
      rejected.push({ rowNumber, reason: 'missingRequiredValue' });
      continue;
    }

    const shelfLife = positiveIntegerOrBlank(get('shelf_life_days'));
    if (shelfLife === undefined) {
      rejected.push({ rowNumber, reason: 'invalidShelfLife', value: get('shelf_life_days') });
      continue;
    }
    const prepared = get('prepared_food');
    if (prepared && prepared !== 'sim' && prepared !== 'não') {
      rejected.push({ rowNumber, reason: 'invalidPreparedFood', value: prepared });
      continue;
    }
    const status = get('status');
    if (status && status !== 'unverified' && status !== 'verified') {
      rejected.push({ rowNumber, reason: 'invalidStatus', value: status });
      continue;
    }
    const temperature = get('storage_temperature_class') || defaultTemperatureClass(storageType);
    if (!temperature) {
      rejected.push({ rowNumber, reason: 'missingTemperatureClass' });
      continue;
    }
    if (!isTemperatureClass(temperature)) {
      rejected.push({ rowNumber, reason: 'invalidTemperatureClass', value: temperature });
      continue;
    }
    const manufacturerDays = positiveIntegerOrBlank(get('manufacturer_days_after_open'));
    if (manufacturerDays === undefined) {
      rejected.push({ rowNumber, reason: 'invalidManufacturerDays', value: get('manufacturer_days_after_open') });
      continue;
    }
    const plantBasedType = get('plant_based_type') || 'none';
    if (!isPlantBasedType(plantBasedType)) {
      rejected.push({ rowNumber, reason: 'invalidPlantBasedType', value: plantBasedType });
      continue;
    }
    const heatTreated = get('heat_treated') || 'não';
    if (heatTreated !== 'sim' && heatTreated !== 'não') {
      rejected.push({ rowNumber, reason: 'invalidHeatTreated', value: heatTreated });
      continue;
    }

    accepted.push({
      rowNumber,
      itemId,
      itemName,
      form,
      storageType,
      storageTemperatureClass: temperature,
      shelfLifeDays: shelfLife,
      preparedFood: prepared ? prepared === 'sim' : defaultPreparedFood(form),
      manufacturerDaysAfterOpen: manufacturerDays,
      source: get('source'),
      plantBasedType,
      heatTreated: heatTreated === 'sim',
    });
  }
  return { accepted, rejected };
}

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('UNCLOSED_QUOTE');
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function positiveIntegerOrBlank(value: string): number | null | undefined {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

function defaultPreparedFood(form: string): boolean {
  return ['cut', 'cortado', 'cooked', 'cozido', 'other', 'outro'].includes(form.toLocaleLowerCase());
}

function defaultTemperatureClass(storage: string): TemperatureClass | '' {
  const normalized = storage.toLocaleLowerCase();
  if (normalized === 'refrigerated' || normalized === 'refrigerado') return 'refrigerated';
  if (normalized === 'frozen' || normalized === 'congelado') return 'frozen';
  return '';
}

function isTemperatureClass(value: string): value is TemperatureClass {
  return value === 'refrigerated' || value === 'frozen' || value === 'ambient';
}

function isPlantBasedType(value: string): value is PlantBasedType {
  return value === 'none' || value === 'drink' || value === 'food';
}
