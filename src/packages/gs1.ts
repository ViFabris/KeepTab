export interface ParsedProductBarcode {
  rawValue: string;
  format: string;
  gtin: string | null;
  lotCode: string | null;
  productionDate: string | null;
  bestBeforeDate: string | null;
  expiryDate: string | null;
}

export function parseProductBarcode(rawValue: string, format: string): ParsedProductBarcode {
  const base: ParsedProductBarcode = {
    rawValue,
    format,
    gtin: null,
    lotCode: null,
    productionDate: null,
    bestBeforeDate: null,
    expiryDate: null,
  };
  const trimmed = rawValue.trim();
  if (/^\d{8,14}$/.test(trimmed)) return { ...base, gtin: trimmed };

  const digitalLink = parseDigitalLink(trimmed);
  if (digitalLink) return { ...base, ...digitalLink };

  const humanReadable = parseParenthesized(trimmed);
  if (humanReadable) return { ...base, ...humanReadable };

  const scannerValue = trimmed.replace(/^\][A-Za-z][0-9]/, '');
  if (scannerValue.startsWith('01') && scannerValue.length >= 16) {
    return { ...base, ...parseElementString(scannerValue) };
  }
  return base;
}

function parseDigitalLink(value: string): Partial<ParsedProductBarcode> | null {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const valueAfter = (ai: string) => {
      const position = parts.indexOf(ai);
      return position >= 0 ? parts[position + 1] ?? null : url.searchParams.get(ai);
    };
    const gtin = valueAfter('01');
    if (!gtin) return null;
    return {
      gtin,
      lotCode: valueAfter('10'),
      productionDate: formatGs1Date(valueAfter('11')),
      bestBeforeDate: formatGs1Date(valueAfter('15')),
      expiryDate: formatGs1Date(valueAfter('17')),
    };
  } catch {
    return null;
  }
}

function parseParenthesized(value: string): Partial<ParsedProductBarcode> | null {
  const matches = [...value.matchAll(/\((01|10|11|15|17)\)([^()]+)/g)];
  if (!matches.length) return null;
  const fields = new Map(matches.map((match) => [match[1], match[2]?.trim() ?? '']));
  return {
    gtin: fields.get('01') ?? null,
    lotCode: fields.get('10') ?? null,
    productionDate: formatGs1Date(fields.get('11')),
    bestBeforeDate: formatGs1Date(fields.get('15')),
    expiryDate: formatGs1Date(fields.get('17')),
  };
}

function parseElementString(value: string): Partial<ParsedProductBarcode> {
  const gtin = value.slice(2, 16);
  let cursor = 16;
  let lotCode: string | null = null;
  let productionDate: string | null = null;
  let bestBeforeDate: string | null = null;
  let expiryDate: string | null = null;
  while (cursor + 2 <= value.length) {
    const ai = value.slice(cursor, cursor + 2);
    cursor += 2;
    if (ai === '11' || ai === '15' || ai === '17') {
      const date = formatGs1Date(value.slice(cursor, cursor + 6));
      cursor += 6;
      if (ai === '11') productionDate = date;
      if (ai === '15') bestBeforeDate = date;
      if (ai === '17') expiryDate = date;
      continue;
    }
    if (ai === '10') {
      const separator = value.indexOf('\u001d', cursor);
      lotCode = value.slice(cursor, separator < 0 ? value.length : separator);
      cursor = separator < 0 ? value.length : separator + 1;
      continue;
    }
    break;
  }
  return { gtin, lotCode, productionDate, bestBeforeDate, expiryDate };
}

function formatGs1Date(value: string | null | undefined): string | null {
  if (!value || !/^\d{6}$/.test(value)) return null;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const encodedDay = Number(value.slice(4, 6));
  const day = encodedDay === 0 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : encodedDay;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
