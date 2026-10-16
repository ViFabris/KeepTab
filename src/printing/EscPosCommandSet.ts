import { bytesPerRow, type MonochromeBitmap } from './bitmap';
import type { CommandSet, CommandSetOptions } from './CommandSet';
import type { EndOfLabelAction } from './PrinterProfile';
import { validatePrinterProfile } from './PrinterProfile';

const ESC = 0x1b;
const GS = 0x1d;

export class EscPosCommandSet implements CommandSet {
  encode(bitmap: MonochromeBitmap, options: CommandSetOptions): Uint8Array {
    validatePrinterProfile(options.profile);
    const copies = options.copies ?? 1;
    if (!Number.isInteger(copies) || copies < 1) throw new Error('PRINT_COPIES_INVALID');
    const job = this.encodeOne(bitmap, options);
    const output = new Uint8Array(job.length * copies);
    for (let copy = 0; copy < copies; copy += 1) output.set(job, copy * job.length);
    return output;
  }

  private encodeOne(bitmap: MonochromeBitmap, { profile }: CommandSetOptions): Uint8Array {
    const parts: Uint8Array[] = [Uint8Array.from([ESC, 0x40, ...profile.prePrintBytes])];
    const rowBytes = bytesPerRow(bitmap.width);
    for (let startRow = 0; startRow < bitmap.height; startRow += profile.rasterChunkHeightRows) {
      const rows = Math.min(profile.rasterChunkHeightRows, bitmap.height - startRow);
      const header = Uint8Array.from([
        GS, 0x76, 0x30, 0x00,
        rowBytes & 0xff, (rowBytes >> 8) & 0xff,
        rows & 0xff, (rows >> 8) & 0xff,
      ]);
      const raster = bitmap.data.slice(startRow * rowBytes, (startRow + rows) * rowBytes);
      parts.push(header, raster);
    }
    parts.push(Uint8Array.from([...endOfLabelBytes(profile.endOfLabelAction, profile.endFeedDots), ...profile.postPrintBytes]));
    return concatBytes(parts);
  }
}

export function endOfLabelBytes(action: EndOfLabelAction, dots: number): readonly number[] {
  switch (action) {
    case 'none': return [];
    case 'lineFeed': return [ESC, 0x4a, dots];
    case 'formFeed': return [0x0c];
    case 'labelFeed': return [GS, 0x0c];
  }
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
