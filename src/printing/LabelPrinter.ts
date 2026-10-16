import type { PrintableLabel, SavedLabel } from '../types';

export interface LabelPrinter {
  readonly maxPrintableWidthMm: number;
  readonly resolutionDpi: number;
  print(label: PrintableLabel): Promise<SavedLabel>;
}
