import { describe, expect, it } from 'vitest';

import { DEFAULT_PRINTER_PROFILE } from '../printing/PrinterProfile';
import { addHours, formatLabelUseBy, formatShelfLife } from './dates';

describe('label date calculations', () => {
  it('adds the configured shelf-life hours to the made time', () => {
    const madeAt = new Date('2026-10-14T12:00:00.000Z');
    expect(addHours(madeAt, 72).toISOString()).toBe('2026-10-17T12:00:00.000Z');
  });

  it('formats whole-day and hourly durations clearly', () => {
    expect(formatShelfLife(72)).toBe('3 days');
    expect(formatShelfLife(36)).toBe('36 hours');
  });

  it('formats durations in Brazilian Portuguese', () => {
    expect(formatShelfLife(24, 'pt-BR')).toBe('1 dia');
    expect(formatShelfLife(36, 'pt-BR')).toBe('36 horas');
  });

  it('uses the exact Portuguese month abbreviations on labels', () => {
    expect(
      formatLabelUseBy('2026-10-20T15:30:00', {
        language: 'pt-BR',
        dateOrder: 'DD/MM/YYYY',
        timeFormat: '24h',
        spellOutMonth: true,
        timeZone: 'America/Sao_Paulo',
        clockOffsetMs: 0,
        labelWidthMm: 60,
        labelHeightMm: 40,
        printerProfile: DEFAULT_PRINTER_PROFILE,
        printerThresholdPercent: 50,
        defaultPrintCopies: 1,
        setupComplete: true,
      }),
    ).toContain('20 OUT 2026');
  });
});
