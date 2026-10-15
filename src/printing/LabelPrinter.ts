import type { PrintableLabel, SavedLabel } from '../types';

export interface LabelPrinter {
  print(label: PrintableLabel): Promise<SavedLabel>;
}
