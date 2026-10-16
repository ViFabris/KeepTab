import type { MonochromeBitmap } from './bitmap';
import type { PrinterProfile } from './PrinterProfile';

export interface CommandSetOptions {
  profile: PrinterProfile;
  copies?: number;
}

export interface CommandSet {
  encode(bitmap: MonochromeBitmap, options: CommandSetOptions): Uint8Array;
}
