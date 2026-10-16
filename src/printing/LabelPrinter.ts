import type { PrintableLabel, SavedLabel } from '../types';
import type { PrintLabelOptions } from './EscPosPrinter';

export interface LabelPrinter {
  readonly maxPrintableWidthMm: number;
  readonly resolutionDpi: number;
  print(label: PrintableLabel, options?: PrintLabelOptions): Promise<SavedLabel>;
}
