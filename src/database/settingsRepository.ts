import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppSettings, DateOrder, Language, TimeFormat } from '../types';

interface SettingsRow {
  language: Language;
  date_order: DateOrder;
  time_format: TimeFormat;
  spell_out_month: number;
  label_width_mm: number;
  label_height_mm: number;
  setup_complete: number;
}

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT language, date_order, time_format, spell_out_month,
            label_width_mm, label_height_mm, setup_complete
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
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `UPDATE app_settings SET
         language = ?, date_order = ?, time_format = ?, spell_out_month = ?,
         label_width_mm = ?, label_height_mm = ?, setup_complete = ?
       WHERE id = 1`,
      settings.language,
      settings.dateOrder,
      settings.timeFormat,
      settings.spellOutMonth ? 1 : 0,
      settings.labelWidthMm,
      settings.labelHeightMm,
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
    labelWidthMm: row.label_width_mm,
    labelHeightMm: row.label_height_mm,
    setupComplete: row.setup_complete === 1,
  };
}
