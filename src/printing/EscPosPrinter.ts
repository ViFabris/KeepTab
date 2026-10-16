import type { SQLiteDatabase } from 'expo-sqlite';

import { savePrintedLabel } from '../database/labelsRepository';
import type { AppSettings, LabelOption, PrintableLabel, SavedLabel } from '../types';
import { fitBitmapToHead, type MonochromeBitmap } from './bitmap';
import type { CommandSet } from './CommandSet';
import { EscPosCommandSet } from './EscPosCommandSet';
import { renderLabelToBitmap } from './LabelRasterizer';
import type { LabelPrinter } from './LabelPrinter';
import { type PrinterTransport } from './PrinterTransport';

export interface PrintLabelOptions {
  copies?: number;
  formOption?: LabelOption;
  storageOption?: LabelOption;
}

export interface PreparedPrintJob {
  bitmap: MonochromeBitmap;
  bytes: Uint8Array;
  copies: number;
}

/** The transport-agnostic printer: rasterize first, then encode and send only ESC/POS bytes. */
export class EscPosPrinter implements LabelPrinter {
  readonly maxPrintableWidthMm: number;
  readonly resolutionDpi: number;
  lastPreparedJob: PreparedPrintJob | null = null;

  constructor(
    private readonly db: SQLiteDatabase,
    private readonly settings: AppSettings,
    private readonly transport: PrinterTransport,
    private readonly commandSet: CommandSet = new EscPosCommandSet(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.resolutionDpi = settings.printerProfile.dpi;
    this.maxPrintableWidthMm = (settings.printerProfile.headWidthDots / settings.printerProfile.dpi) * 25.4;
  }

  async prepare(label: PrintableLabel, options: PrintLabelOptions = {}): Promise<PreparedPrintJob> {
    const raster = await renderLabelToBitmap({
      label,
      settings: this.settings,
      formOption: options.formOption,
      storageOption: options.storageOption,
    });
    const bitmap = fitBitmapToHead(raster, this.settings.printerProfile.headWidthDots);
    const copies = options.copies ?? this.settings.defaultPrintCopies;
    const bytes = this.commandSet.encode(bitmap, { profile: this.settings.printerProfile, copies });
    const prepared = { bitmap, bytes, copies };
    this.lastPreparedJob = prepared;
    return prepared;
  }

  async print(label: PrintableLabel, options: PrintLabelOptions = {}): Promise<SavedLabel> {
    const prepared = await this.prepare(label, options);
    const sent = await this.transport.send(prepared.bytes);
    if (!sent.ok) throw new Error(sent.error);
    const printedAt = this.now().toISOString();
    if (label.testOnly) {
      return { ...label, id: 0, status: 'active', printedAt };
    }
    return savePrintedLabel(this.db, label, printedAt);
  }
}
