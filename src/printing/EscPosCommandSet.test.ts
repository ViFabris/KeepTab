import { describe, expect, it } from 'vitest';

import { createBitmap, getBitmapDot, setBitmapDot } from './bitmap';
import { EscPosCommandSet, endOfLabelBytes } from './EscPosCommandSet';
import { DEFAULT_PRINTER_PROFILE } from './PrinterProfile';
import { fitQrModules } from './qrGeometry';

describe('EscPosCommandSet', () => {
  it('encodes a tiny 16 x 2 bitmap as GS v 0 with MSB-first data', () => {
    const bitmap = createBitmap(16, 2);
    setBitmapDot(bitmap, 0, 0);
    setBitmapDot(bitmap, 15, 0);
    setBitmapDot(bitmap, 7, 1);
    const bytes = new EscPosCommandSet().encode(bitmap, {
      profile: { ...DEFAULT_PRINTER_PROFILE, endOfLabelAction: 'none', rasterChunkHeightRows: 128 },
    });
    expect(Array.from(bytes)).toEqual([
      0x1b, 0x40,
      0x1d, 0x76, 0x30, 0x00, 0x02, 0x00, 0x02, 0x00,
      0x80, 0x01, 0x01, 0x00,
    ]);
  });

  it('uses ceil(width / 8) for a width that is not byte-aligned', () => {
    const bitmap = createBitmap(9, 1);
    setBitmapDot(bitmap, 8, 0);
    const bytes = new EscPosCommandSet().encode(bitmap, {
      profile: { ...DEFAULT_PRINTER_PROFILE, endOfLabelAction: 'none' },
    });
    expect(Array.from(bytes.slice(2, 10))).toEqual([0x1d, 0x76, 0x30, 0x00, 0x02, 0x00, 0x01, 0x00]);
    expect(Array.from(bytes.slice(10))).toEqual([0x00, 0x80]);
  });

  it('splits raster rows into configured horizontal bands', () => {
    const bitmap = createBitmap(8, 5);
    const bytes = new EscPosCommandSet().encode(bitmap, {
      profile: { ...DEFAULT_PRINTER_PROFILE, endOfLabelAction: 'none', rasterChunkHeightRows: 2 },
    });
    expect(Array.from(bytes)).toEqual([
      0x1b, 0x40,
      0x1d, 0x76, 0x30, 0, 1, 0, 2, 0, 0, 0,
      0x1d, 0x76, 0x30, 0, 1, 0, 2, 0, 0, 0,
      0x1d, 0x76, 0x30, 0, 1, 0, 1, 0, 0,
    ]);
  });

  it.each([
    ['none', [], 24],
    ['lineFeed', [0x1b, 0x4a, 17], 17],
    ['formFeed', [0x0c], 24],
    ['labelFeed', [0x1d, 0x0c], 24],
  ] as const)('uses end bytes for %s', (action, expected, dots) => {
    expect(endOfLabelBytes(action, dots)).toEqual(expected);
  });
});

describe('bitmap fitting', () => {
  it('centers a narrower bitmap with white padding', async () => {
    const { fitBitmapToHead } = await import('./bitmap');
    const bitmap = createBitmap(8, 1);
    setBitmapDot(bitmap, 0, 0);
    const fitted = fitBitmapToHead(bitmap, 16);
    expect(fitted.width).toBe(16);
    expect(getBitmapDot(fitted, 4, 0)).toBe(true);
    expect(getBitmapDot(fitted, 0, 0)).toBe(false);
  });

  it('rotates a wide label when its shorter side fits the head', async () => {
    const { fitBitmapToHead } = await import('./bitmap');
    const bitmap = createBitmap(20, 8);
    setBitmapDot(bitmap, 0, 0);
    const fitted = fitBitmapToHead(bitmap, 8);
    expect([fitted.width, fitted.height]).toEqual([8, 20]);
    expect(getBitmapDot(fitted, 7, 0)).toBe(true);
  });
});

describe('QR geometry', () => {
  it('uses the largest whole-dot module and preserves a quiet zone', () => {
    expect(fitQrModules(21, 100, 8)).toEqual({ moduleSize: 3, quietZone: 12, contentSize: 63, offset: 6 });
  });
});
