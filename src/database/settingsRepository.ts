import type { SQLiteDatabase } from 'expo-sqlite';

import type { Language } from '../types';

const LANGUAGE_KEY = 'language';

export async function getLanguage(db: SQLiteDatabase): Promise<Language | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    LANGUAGE_KEY,
  );
  return row?.value === 'pt-BR' || row?.value === 'en' ? row.value : null;
}

export async function saveLanguage(
  db: SQLiteDatabase,
  language: Language,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    LANGUAGE_KEY,
    language,
  );
}
