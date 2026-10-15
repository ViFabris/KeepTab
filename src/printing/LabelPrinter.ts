import type { PrintableLabel, SavedLabel } from '../types';

export interface LabelPrinter {
  readonly maxWidthMm: number;
  print(label: PrintableLabel): Promise<SavedLabel>;
}
