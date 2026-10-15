import { describe, expect, it } from 'vitest';

import {
  createClockDraft,
  getAppNow,
  getZonedDateTimeParts,
  isValidTimeZone,
  parseClockDraft,
  reformatClockDraft,
} from './appClock';

const ISO_FORMAT = { dateOrder: 'YYYY-MM-DD' as const, timeFormat: '24h' as const };

describe('app clock', () => {
  it('accepts IANA time zones and rejects unknown ones', () => {
    expect(isValidTimeZone('America/Sao_Paulo')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Brazil/Nowhere')).toBe(false);
  });

  it('turns a typed wall time into a persistent running offset', () => {
    const systemNow = new Date('2026-10-15T12:34:30.000Z');
    const patch = parseClockDraft(
      { date: '2026-10-20', time: '09:15', timeZone: 'America/Sao_Paulo' },
      ISO_FORMAT,
      systemNow,
    );

    expect(patch).not.toBeNull();
    const appNow = getAppNow(patch!, systemNow);
    expect(getZonedDateTimeParts(appNow, patch!.timeZone)).toMatchObject({
      year: 2026,
      month: 10,
      day: 20,
      hour: 9,
      minute: 15,
      second: 0,
    });

    const ninetyMinutesLater = new Date(systemNow.getTime() + 90 * 60 * 1000);
    expect(getAppNow(patch!, ninetyMinutesLater).getTime() - appNow.getTime()).toBe(
      90 * 60 * 1000,
    );
  });

  it('creates editable values in the configured time zone', () => {
    const settings = {
      timeZone: 'America/Sao_Paulo',
      clockOffsetMs: 0,
      dateOrder: 'DD/MM/YYYY' as const,
      timeFormat: '12h' as const,
    };
    expect(createClockDraft(settings, new Date('2026-10-15T22:45:00.000Z'))).toEqual({
      date: '15/10/2026',
      time: '07:45 PM',
      timeZone: 'America/Sao_Paulo',
    });
  });

  it('reformats an existing draft when display preferences change', () => {
    expect(
      reformatClockDraft(
        { date: '10/15/2026', time: '07:45 PM', timeZone: 'America/Sao_Paulo' },
        { dateOrder: 'MM/DD/YYYY', timeFormat: '12h' },
        { dateOrder: 'YYYY-MM-DD', timeFormat: '24h' },
      ),
    ).toEqual({
      date: '2026-10-15',
      time: '19:45',
      timeZone: 'America/Sao_Paulo',
    });
  });

  it('rejects invalid calendar values and daylight-saving gaps', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(
      parseClockDraft(
        { date: '2026-02-30', time: '09:00', timeZone: 'America/Sao_Paulo' },
        ISO_FORMAT,
        now,
      ),
    ).toBeNull();
    expect(
      parseClockDraft(
        { date: '2026-01-20', time: '25:00', timeZone: 'America/Sao_Paulo' },
        ISO_FORMAT,
        now,
      ),
    ).toBeNull();
  });
});
