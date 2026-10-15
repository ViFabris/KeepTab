import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';

import { isValidPin } from './pinValidation';

export { isValidPin, sanitizePin } from './pinValidation';

const SECURE_STORE_KEY = 'keeptab.admin-pin.v1';
const SQLITE_KEY = 'admin_pin_credentials';

interface PinCredentials {
  salt: string;
  hash: string;
}

export async function hasAdminPin(db: SQLiteDatabase): Promise<boolean> {
  return (await readCredentials(db)) !== null;
}

export async function saveAdminPin(db: SQLiteDatabase, pin: string): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error('INVALID_PIN');
  }
  const saltBytes = await Crypto.getRandomBytesAsync(24);
  const salt = Array.from(saltBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const credentials = { salt, hash: await hashPin(pin, salt) };
  const serialized = JSON.stringify(credentials);

  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(SECURE_STORE_KEY, serialized);
      await db.runAsync('DELETE FROM app_metadata WHERE key = ?', SQLITE_KEY);
      return;
    }
  } catch {
    // SQLite is the documented offline fallback when secure storage is unavailable.
  }

  await db.runAsync(
    `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    SQLITE_KEY,
    serialized,
  );
}

export async function verifyAdminPin(
  db: SQLiteDatabase,
  pin: string,
): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const credentials = await readCredentials(db);
  if (!credentials) return false;
  return (await hashPin(pin, credentials.salt)) === credentials.hash;
}

async function readCredentials(db: SQLiteDatabase): Promise<PinCredentials | null> {
  const fallbackRow = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    SQLITE_KEY,
  );
  if (fallbackRow) return parseCredentials(fallbackRow.value);

  try {
    if (await SecureStore.isAvailableAsync()) {
      const value = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (value) return parseCredentials(value);
    }
  } catch {
    // Continue to the SQLite fallback.
  }

  return null;
}

function parseCredentials(value: string): PinCredentials | null {
  try {
    const parsed = JSON.parse(value) as Partial<PinCredentials>;
    return typeof parsed.salt === 'string' && typeof parsed.hash === 'string'
      ? { salt: parsed.salt, hash: parsed.hash }
      : null;
  } catch {
    return null;
  }
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}
