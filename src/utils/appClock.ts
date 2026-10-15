import type { AppSettings, DateOrder, TimeFormat } from '../types';

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

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
  settings: Pick<AppSettings, 'clockOffsetMs' | 'timeZone' | 'dateOrder' | 'timeFormat'>,
  systemNow = new Date(),
): ClockDraft {
  const parts = getZonedDateTimeParts(getAppNow(settings, systemNow), settings.timeZone);
  return {
    date: formatDraftDate(parts, settings.dateOrder),
    time: formatDraftTime(parts, settings.timeFormat),
    timeZone: settings.timeZone,
  };
}

export function parseClockDraft(
  draft: ClockDraft,
  settings: Pick<AppSettings, 'dateOrder' | 'timeFormat'>,
  systemNow = new Date(),
): Pick<AppSettings, 'clockOffsetMs' | 'timeZone'> | null {
  const dateParts = parseDraftDate(draft.date, settings.dateOrder);
  const timeParts = parseDraftTime(draft.time, settings.timeFormat);
  const timeZone = draft.timeZone.trim();
  if (!dateParts || !timeParts || !isValidTimeZone(timeZone)) return null;

  const desired: ZonedDateTimeParts = {
    ...dateParts,
    ...timeParts,
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

export function reformatClockDraft(
  draft: ClockDraft,
  previous: Pick<AppSettings, 'dateOrder' | 'timeFormat'>,
  next: Pick<AppSettings, 'dateOrder' | 'timeFormat'>,
): ClockDraft {
  const dateParts = parseDraftDate(draft.date, previous.dateOrder);
  const timeParts = parseDraftTime(draft.time, previous.timeFormat);
  if (!dateParts || !timeParts) return draft;
  const parts: ZonedDateTimeParts = { ...dateParts, ...timeParts, second: 0 };
  return {
    ...draft,
    date: formatDraftDate(parts, next.dateOrder),
    time: formatDraftTime(parts, next.timeFormat),
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

function parseDraftDate(
  value: string,
  dateOrder: DateOrder,
): Pick<ZonedDateTimeParts, 'year' | 'month' | 'day'> | null {
  const match = /^(\d{2,4})[/-](\d{2})[/-](\d{2,4})$/.exec(value.trim());
  if (!match) return null;
  if (dateOrder === 'YYYY-MM-DD') {
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }
  if (dateOrder === 'MM/DD/YYYY') {
    return { year: Number(match[3]), month: Number(match[1]), day: Number(match[2]) };
  }
  return { year: Number(match[3]), month: Number(match[2]), day: Number(match[1]) };
}

function parseDraftTime(
  value: string,
  timeFormat: TimeFormat,
): Pick<ZonedDateTimeParts, 'hour' | 'minute'> | null {
  if (timeFormat === '24h') {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
  }
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;
  const twelveHour = Number(match[1]);
  if (twelveHour < 1 || twelveHour > 12) return null;
  const hour = (twelveHour % 12) + (match[3]?.toUpperCase() === 'PM' ? 12 : 0);
  return { hour, minute: Number(match[2]) };
}

function formatDraftDate(parts: ZonedDateTimeParts, dateOrder: DateOrder): string {
  const day = pad(parts.day);
  const month = pad(parts.month);
  if (dateOrder === 'YYYY-MM-DD') return `${parts.year}-${month}-${day}`;
  if (dateOrder === 'MM/DD/YYYY') return `${month}/${day}/${parts.year}`;
  return `${day}/${month}/${parts.year}`;
}

function formatDraftTime(parts: ZonedDateTimeParts, timeFormat: TimeFormat): string {
  if (timeFormat === '24h') return `${pad(parts.hour)}:${pad(parts.minute)}`;
  const suffix = parts.hour >= 12 ? 'PM' : 'AM';
  const hour = parts.hour % 12 || 12;
  return `${pad(hour)}:${pad(parts.minute)} ${suffix}`;
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
