import type { SQLiteDatabase } from 'expo-sqlite';

import { savePrintedLabel } from '../database/labelsRepository';
import type { PrintableLabel, SavedLabel } from '../types';
import type { LabelPrinter } from './LabelPrinter';
import { resolveLabelTemplate, type ResolvedLabelLayout } from './labelLayout';
import { findNearestLabelTemplate, isTemplateAvailable } from './labelTemplates';

export class MockPrinter implements LabelPrinter {
  readonly maxPrintableWidthMm = 104;
  readonly resolutionDpi = 203;
  lastPreparedLayout: ResolvedLabelLayout | null = null;

  constructor(
    private readonly db: SQLiteDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async print(label: PrintableLabel): Promise<SavedLabel> {
    const template = findNearestLabelTemplate(label.labelWidthMm, label.labelHeightMm);
    if (!isTemplateAvailable(template, this.maxPrintableWidthMm)) {
      throw new Error('LABEL_SIZE_EXCEEDS_PRINT_HEAD');
    }
    this.lastPreparedLayout = resolveLabelTemplate(template, this.resolutionDpi, 'printer');
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
