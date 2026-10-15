import type { AppSettings } from '../types';

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

export const COMMON_TIME_ZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Cuiaba',
  'America/Rio_Branco',
  'America/Noronha',
  'UTC',
] as const;

export interface ClockDraft {
  date: string;
  time: string;
  timeZone: string;
}

export interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function getAppNow(
  settings: Pick<AppSettings, 'clockOffsetMs'>,
  systemNow = new Date(),
): Date {
  return new Date(systemNow.getTime() + settings.clockOffsetMs);
}

export function createClockDraft(
  settings: Pick<AppSettings, 'clockOffsetMs' | 'timeZone'>,
  systemNow = new Date(),
): ClockDraft {
  const parts = getZonedDateTimeParts(getAppNow(settings, systemNow), settings.timeZone);
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    timeZone: settings.timeZone,
  };
}

export function parseClockDraft(
  draft: ClockDraft,
  systemNow = new Date(),
): Pick<AppSettings, 'clockOffsetMs' | 'timeZone'> | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.date.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(draft.time.trim());
  const timeZone = draft.timeZone.trim();
  if (!dateMatch || !timeMatch || !isValidTimeZone(timeZone)) return null;

  const desired: ZonedDateTimeParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: 0,
  };
  if (!isValidWallTime(desired)) return null;

  const instant = zonedDateTimeToInstant(desired, timeZone);
  if (!instant) return null;
  return {
    timeZone,
    clockOffsetMs: instant.getTime() - systemNow.getTime(),
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

export function getZonedDayNumber(date: Date, timeZone: string): number {
  const { year, month, day } = getZonedDateTimeParts(date, timeZone);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function zonedDateTimeToInstant(
  desired: ZonedDateTimeParts,
  timeZone: string,
): Date | null {
  const desiredAsUtc = partsAsUtc(desired);
  let candidate = desiredAsUtc;

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedDateTimeParts(new Date(candidate), timeZone);
    const correction = desiredAsUtc - partsAsUtc(actual);
    if (correction === 0) break;
    candidate += correction;
  }

  const result = new Date(candidate);
  return sameParts(getZonedDateTimeParts(result, timeZone), desired) ? result : null;
}

function isValidWallTime(parts: ZonedDateTimeParts): boolean {
  if (parts.hour < 0 || parts.hour > 23 || parts.minute < 0 || parts.minute > 59) {
    return false;
  }
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return (
    parts.year >= 2000 &&
    parts.year <= 2100 &&
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day
  );
}

function partsAsUtc(parts: ZonedDateTimeParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

function sameParts(left: ZonedDateTimeParts, right: ZonedDateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
