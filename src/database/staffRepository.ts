import type { SQLiteDatabase } from 'expo-sqlite';

import type { StaffMember } from '../types';

interface StaffRow {
  id: number;
  name: string;
  created_at: string;
}

export async function getStaff(db: SQLiteDatabase): Promise<StaffMember[]> {
  const rows = await db.getAllAsync<StaffRow>(
    'SELECT id, name, created_at FROM staff ORDER BY name COLLATE NOCASE',
  );
  return rows.map(mapStaffRow);
}

export async function addStaff(db: SQLiteDatabase, rawName: string): Promise<StaffMember> {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) {
    throw new Error('Enter a staff name.');
  }

  const createdAt = new Date().toISOString();
  try {
    const result = await db.runAsync(
      'INSERT INTO staff (name, created_at) VALUES (?, ?)',
      name,
      createdAt,
    );
    return { id: result.lastInsertRowId, name, createdAt };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
      throw new Error('That staff name already exists.');
    }
    throw error;
  }
}

export async function removeStaff(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM staff WHERE id = ?', id);
}

function mapStaffRow(row: StaffRow): StaffMember {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}
