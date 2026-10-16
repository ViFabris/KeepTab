/** A row-major, one-bit bitmap. A set bit is black; the high bit is the leftmost dot. */
export interface MonochromeBitmap {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

export function bytesPerRow(width: number): number {
  if (!Number.isInteger(width) || width < 1) throw new Error('BITMAP_WIDTH_INVALID');
  return Math.ceil(width / 8);
}

export function createBitmap(width: number, height: number, data?: Uint8Array): MonochromeBitmap {
  if (!Number.isInteger(height) || height < 1) throw new Error('BITMAP_HEIGHT_INVALID');
  const expectedLength = bytesPerRow(width) * height;
  const nextData = data ? new Uint8Array(data) : new Uint8Array(expectedLength);
  if (nextData.length !== expectedLength) throw new Error('BITMAP_DATA_LENGTH_INVALID');
  return { width, height, data: nextData };
}

export function getBitmapDot(bitmap: MonochromeBitmap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) return false;
  const index = y * bytesPerRow(bitmap.width) + Math.floor(x / 8);
  return (bitmap.data[index]! & (0x80 >> (x % 8))) !== 0;
}

export function setBitmapDot(bitmap: MonochromeBitmap, x: number, y: number, black = true): void {
  if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) return;
  const index = y * bytesPerRow(bitmap.width) + Math.floor(x / 8);
  const mask = 0x80 >> (x % 8);
  bitmap.data[index] = black ? bitmap.data[index]! | mask : bitmap.data[index]! & ~mask;
}

/** Threshold RGBA pixels without dithering. Transparent pixels are composited over white. */
export function thresholdRgbaToBitmap(
  rgba: Uint8Array,
  width: number,
  height: number,
  thresholdPercent = 50,
): MonochromeBitmap {
  if (rgba.length !== width * height * 4) throw new Error('RGBA_DATA_LENGTH_INVALID');
  if (thresholdPercent < 0 || thresholdPercent > 100) throw new Error('THRESHOLD_INVALID');
  const bitmap = createBitmap(width, height);
  const threshold = 255 * (thresholdPercent / 100);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    const alpha = rgba[offset + 3]! / 255;
    const red = rgba[offset]! * alpha + 255 * (1 - alpha);
    const green = rgba[offset + 1]! * alpha + 255 * (1 - alpha);
    const blue = rgba[offset + 2]! * alpha + 255 * (1 - alpha);
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    if (luminance <= threshold) setBitmapDot(bitmap, pixel % width, Math.floor(pixel / width));
  }
  return bitmap;
}

export function rotateBitmap90Clockwise(source: MonochromeBitmap): MonochromeBitmap {
  const rotated = createBitmap(source.height, source.width);
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (getBitmapDot(source, x, y)) setBitmapDot(rotated, source.height - 1 - y, x);
    }
  }
  return rotated;
}

export function centerBitmapOnHead(bitmap: MonochromeBitmap, headWidthDots: number): MonochromeBitmap {
  if (!Number.isInteger(headWidthDots) || headWidthDots < 1) throw new Error('PRINT_HEAD_WIDTH_INVALID');
  if (bitmap.width > headWidthDots) throw new Error('LABEL_SIZE_EXCEEDS_PRINT_HEAD');
  const centered = createBitmap(headWidthDots, bitmap.height);
  const offset = Math.floor((headWidthDots - bitmap.width) / 2);
  for (let y = 0; y < bitmap.height; y += 1) {
    for (let x = 0; x < bitmap.width; x += 1) {
      if (getBitmapDot(bitmap, x, y)) setBitmapDot(centered, x + offset, y);
    }
  }
  return centered;
}

export function fitBitmapToHead(bitmap: MonochromeBitmap, headWidthDots: number): MonochromeBitmap {
  if (bitmap.width <= headWidthDots) return centerBitmapOnHead(bitmap, headWidthDots);
  if (bitmap.height <= headWidthDots) {
    return centerBitmapOnHead(rotateBitmap90Clockwise(bitmap), headWidthDots);
  }
  throw new Error('LABEL_SIZE_EXCEEDS_PRINT_HEAD');
}

export function bitmapToRgba(bitmap: MonochromeBitmap): Uint8Array {
  const rgba = new Uint8Array(bitmap.width * bitmap.height * 4);
  for (let y = 0; y < bitmap.height; y += 1) {
    for (let x = 0; x < bitmap.width; x += 1) {
      const offset = (y * bitmap.width + x) * 4;
      const value = getBitmapDot(bitmap, x, y) ? 0 : 255;
      rgba[offset] = value;
      rgba[offset + 1] = value;
      rgba[offset + 2] = value;
      rgba[offset + 3] = 255;
    }
  }
  return rgba;
}
