import type { SQLiteDatabase } from 'expo-sqlite';

import { savePrintedLabel } from '../database/labelsRepository';
import type { PrintableLabel, SavedLabel } from '../types';
import type { LabelPrinter } from './LabelPrinter';

export class MockPrinter implements LabelPrinter {
  constructor(private readonly db: SQLiteDatabase) {}

  async print(label: PrintableLabel): Promise<SavedLabel> {
    return savePrintedLabel(this.db, label);
  }
}
