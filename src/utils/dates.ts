import { getLocale } from '../i18n';
import type { Language } from '../types';

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
