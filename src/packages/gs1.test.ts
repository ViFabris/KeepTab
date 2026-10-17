import { describe, expect, it } from 'vitest';

import { parseProductBarcode } from './gs1';

describe('product barcode parsing', () => {
  it('treats an EAN-13 as product identification only', () => {
    expect(parseProductBarcode('7891234567895', 'ean13')).toMatchObject({
      gtin: '7891234567895',
      lotCode: null,
      expiryDate: null,
    });
  });

  it('extracts GTIN, expiry, and lot from GS1 human-readable data', () => {
    expect(parseProductBarcode('(01)07891234567890(17)271231(10)LOT42', 'datamatrix')).toMatchObject({
      gtin: '07891234567890',
      expiryDate: '2027-12-31',
      lotCode: 'LOT42',
    });
  });

  it('extracts GS1 Digital Link values', () => {
    expect(parseProductBarcode('https://example.test/01/07891234567890/10/ABC?17=270630', 'qr')).toMatchObject({
      gtin: '07891234567890',
      expiryDate: '2027-06-30',
      lotCode: 'ABC',
    });
  });

  it('uses the last day of the month for a GS1 day value of 00', () => {
    expect(parseProductBarcode('(01)07891234567890(17)270200', 'datamatrix').expiryDate).toBe('2027-02-28');
  });
});
