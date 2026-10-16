export type EndOfLabelAction = 'none' | 'lineFeed' | 'formFeed' | 'labelFeed';

export interface PrinterProfile {
  name: string;
  dpi: number;
  headWidthDots: number;
  rasterChunkHeightRows: number;
  prePrintBytes: readonly number[];
  postPrintBytes: readonly number[];
  endOfLabelAction: EndOfLabelAction;
  endFeedDots: number;
}

export const DEFAULT_PRINTER_PROFILE: PrinterProfile = {
  name: '58 mm / 384 dots',
  dpi: 203, // Label-printer resolution differs by model; verify this on the real printer.
  headWidthDots: 384, // Print-head widths differ by model; verify this on the real printer.
  rasterChunkHeightRows: 128, // Buffer limits differ by model; reduce this if the printer drops rows.
  prePrintBytes: [], // Some label printers require setup bytes; add only bytes tested on the real printer.
  postPrintBytes: [], // Some label printers require cleanup bytes; add only bytes tested on the real printer.
  endOfLabelAction: 'lineFeed', // Feed behavior differs by model and label stock; verify on the real printer.
  endFeedDots: 24, // The required gap differs by model and stock; verify on the real printer.
};

export const EIGHTY_MM_PRINTER_PROFILE: PrinterProfile = {
  ...DEFAULT_PRINTER_PROFILE,
  name: '80 mm / 576 dots',
  headWidthDots: 576,
};

export function clonePrinterProfile(profile: PrinterProfile): PrinterProfile {
  return {
    ...profile,
    prePrintBytes: [...profile.prePrintBytes],
    postPrintBytes: [...profile.postPrintBytes],
  };
}

export function validatePrinterProfile(profile: PrinterProfile): void {
  if (!profile.name.trim()) throw new Error('PRINTER_PROFILE_NAME_REQUIRED');
  if (!Number.isInteger(profile.dpi) || profile.dpi < 72 || profile.dpi > 1200) {
    throw new Error('PRINTER_DPI_INVALID');
  }
  if (!Number.isInteger(profile.headWidthDots) || profile.headWidthDots < 8) {
    throw new Error('PRINT_HEAD_WIDTH_INVALID');
  }
  if (!Number.isInteger(profile.rasterChunkHeightRows) || profile.rasterChunkHeightRows < 1) {
    throw new Error('RASTER_CHUNK_HEIGHT_INVALID');
  }
  if (!Number.isInteger(profile.endFeedDots) || profile.endFeedDots < 0 || profile.endFeedDots > 255) {
    throw new Error('END_FEED_DOTS_INVALID');
  }
  for (const byte of [...profile.prePrintBytes, ...profile.postPrintBytes]) {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) throw new Error('RAW_BYTE_INVALID');
  }
}

export function hexToBytes(value: string): readonly number[] {
  const compact = value.replace(/\s+/g, '');
  if (!compact) return [];
  if (!/^[0-9a-fA-F]+$/.test(compact) || compact.length % 2 !== 0) throw new Error('RAW_BYTES_HEX_INVALID');
  const bytes: number[] = [];
  for (let index = 0; index < compact.length; index += 2) bytes.push(Number.parseInt(compact.slice(index, index + 2), 16));
  return bytes;
}

export function bytesToHex(bytes: readonly number[] | Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
