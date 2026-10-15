import { getLocale } from '../i18n';
import type { AppSettings, Language } from '../types';
import { getZonedDateTimeParts } from './appClock';

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDateTime(iso: string, language: Language = 'en'): string {
  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatConfiguredDateTime(iso: string, settings: AppSettings): string {
  const date = new Date(iso);
  return `${formatConfiguredDate(date, settings)} ${formatConfiguredTime(date, settings)}`;
}

export function formatLabelUseBy(iso: string, settings: AppSettings): string {
  const date = new Date(iso);
  const dateText = settings.spellOutMonth
    ? formatSpelledMonth(date, settings)
    : formatConfiguredDate(date, settings);
  return `${dateText} ${formatConfiguredTime(date, settings)}`;
}

function formatConfiguredDate(date: Date, settings: AppSettings): string {
  const parts = getZonedDateTimeParts(date, settings.timeZone);
  const day = String(parts.day).padStart(2, '0');
  const month = String(parts.month).padStart(2, '0');
  const year = String(parts.year);
  if (settings.dateOrder === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (settings.dateOrder === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

function formatConfiguredTime(date: Date, settings: AppSettings): string {
  return new Intl.DateTimeFormat(getLocale(settings.language), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12h',
    timeZone: settings.timeZone,
  }).format(date);
}

function formatSpelledMonth(date: Date, settings: AppSettings): string {
  const months = settings.language === 'pt-BR'
    ? ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
    : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const parts = getZonedDateTimeParts(date, settings.timeZone);
  const month = months[parts.month - 1] ?? '';
  const day = String(parts.day).padStart(2, '0');
  return settings.language === 'pt-BR'
    ? `${day} ${month} ${parts.year}`
    : `${month} ${day} ${parts.year}`;
}

export function formatShelfLife(hours: number, language: Language = 'en'): string {
  if (hours % 24 === 0) {
    const days = hours / 24;
    if (language === 'pt-BR') {
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (language === 'pt-BR') {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
