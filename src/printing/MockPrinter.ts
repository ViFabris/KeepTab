import type { SQLiteDatabase } from 'expo-sqlite';

import { savePrintedLabel } from '../database/labelsRepository';
import type { PrintableLabel, SavedLabel } from '../types';
import type { LabelPrinter } from './LabelPrinter';

export class MockPrinter implements LabelPrinter {
  readonly maxWidthMm = 100;

  constructor(private readonly db: SQLiteDatabase) {}

  async print(label: PrintableLabel): Promise<SavedLabel> {
    if (label.testOnly) {
      return {
        ...label,
        id: 0,
        status: 'active',
        printedAt: new Date().toISOString(),
      };
    }
    return savePrintedLabel(this.db, label);
  }
}
