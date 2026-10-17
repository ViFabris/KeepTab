import type { SQLiteDatabase } from 'expo-sqlite';

import { clonePrinterProfile, DEFAULT_PRINTER_PROFILE, type PrinterProfile } from '../printing/PrinterProfile';
import type { AppSettings, DateOrder, Jurisdiction, Language, TimeFormat, VerificationMode } from '../types';
import { withWriteTransaction } from './transactions';

interface SettingsRow {
  language: Language;
  date_order: DateOrder;
  time_format: TimeFormat;
  spell_out_month: number;
  time_zone: string;
  clock_offset_ms: number;
  label_width_mm: number;
  label_height_mm: number;
  printer_profile_json: string;
  printer_threshold_percent: number;
  default_print_copies: number;
  jurisdiction: Jurisdiction;
  fridge_at_or_below_4c: number;
  reduced_maximum_days: number;
  verification_mode: VerificationMode;
  legal_notice_seen: number;
  setup_complete: number;
}

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT language, date_order, time_format, spell_out_month,
            time_zone, clock_offset_ms, label_width_mm, label_height_mm,
            printer_profile_json, printer_threshold_percent, default_print_copies, setup_complete
            , jurisdiction, fridge_at_or_below_4c, reduced_maximum_days,
            verification_mode, legal_notice_seen
     FROM app_settings WHERE id = 1`,
  );
  if (!row) {
    throw new Error('SETTINGS_NOT_INITIALIZED');
  }
  return mapSettings(row);
}

export async function saveAppSettings(
  db: SQLiteDatabase,
  settings: AppSettings,
): Promise<void> {
  await withWriteTransaction(db, async (transaction) => {
    await transaction.runAsync(
      `UPDATE app_settings SET
         language = ?, date_order = ?, time_format = ?, spell_out_month = ?,
         time_zone = ?, clock_offset_ms = ?, label_width_mm = ?, label_height_mm = ?,
         printer_profile_json = ?, printer_threshold_percent = ?, default_print_copies = ?,
         jurisdiction = ?, fridge_at_or_below_4c = ?, reduced_maximum_days = ?,
         verification_mode = ?, legal_notice_seen = ?,
         setup_complete = ?
       WHERE id = 1`,
      settings.language,
      settings.dateOrder,
      settings.timeFormat,
      settings.spellOutMonth ? 1 : 0,
      settings.timeZone,
      settings.clockOffsetMs,
      settings.labelWidthMm,
      settings.labelHeightMm,
      JSON.stringify(settings.printerProfile),
      settings.printerThresholdPercent,
      settings.defaultPrintCopies,
      settings.jurisdiction,
      settings.fridgeAtOrBelow4C ? 1 : 0,
      settings.reducedMaximumDays,
      settings.verificationMode,
      settings.legalNoticeSeen ? 1 : 0,
      settings.setupComplete ? 1 : 0,
    );
    await transaction.runAsync(
      `INSERT INTO app_metadata (key, value) VALUES ('language', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      settings.language,
    );
  });
}

export function defaultsForLanguage(language: Language): Pick<
  AppSettings,
  'dateOrder' | 'timeFormat' | 'spellOutMonth'
> {
  return {
    dateOrder: language === 'pt-BR' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
    timeFormat: language === 'pt-BR' ? '24h' : '12h',
    spellOutMonth: true,
  };
}

function mapSettings(row: SettingsRow): AppSettings {
  return {
    language: row.language,
    dateOrder: row.date_order,
    timeFormat: row.time_format,
    spellOutMonth: row.spell_out_month === 1,
    timeZone: row.time_zone,
    clockOffsetMs: row.clock_offset_ms,
    labelWidthMm: row.label_width_mm,
    labelHeightMm: row.label_height_mm,
    printerProfile: parsePrinterProfile(row.printer_profile_json),
    printerThresholdPercent: row.printer_threshold_percent,
    defaultPrintCopies: row.default_print_copies,
    jurisdiction: row.jurisdiction,
    fridgeAtOrBelow4C: row.fridge_at_or_below_4c === 1,
    reducedMaximumDays: row.reduced_maximum_days,
    verificationMode: row.verification_mode,
    legalNoticeSeen: row.legal_notice_seen === 1,
    setupComplete: row.setup_complete === 1,
  };
}

function parsePrinterProfile(value: string): PrinterProfile {
  if (!value) return clonePrinterProfile(DEFAULT_PRINTER_PROFILE);
  try {
    const parsed = JSON.parse(value) as Partial<PrinterProfile>;
    return {
      ...clonePrinterProfile(DEFAULT_PRINTER_PROFILE),
      ...parsed,
      prePrintBytes: Array.isArray(parsed.prePrintBytes) ? parsed.prePrintBytes : [],
      postPrintBytes: Array.isArray(parsed.postPrintBytes) ? parsed.postPrintBytes : [],
    };
  } catch {
    return clonePrinterProfile(DEFAULT_PRINTER_PROFILE);
  }
}
