import type { SQLiteDatabase } from 'expo-sqlite';

import { savePrintedLabel } from '../database/labelsRepository';
import type { PrintableLabel, SavedLabel } from '../types';
import type { LabelPrinter } from './LabelPrinter';

export class MockPrinter implements LabelPrinter {
  readonly maxWidthMm = 100;

  constructor(
    private readonly db: SQLiteDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async print(label: PrintableLabel): Promise<SavedLabel> {
    const printedAt = this.now().toISOString();
    if (label.testOnly) {
      return {
        ...label,
        id: 0,
        status: 'active',
        printedAt,
      };
    }
    return savePrintedLabel(this.db, label, printedAt);
  }
}
