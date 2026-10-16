import type {
  LabelQrZone,
  LabelTemplate,
  LabelTextZone,
  LabelTextZoneId,
} from './labelTemplates';

export const DEFAULT_PRINTER_DPI = 203;
export const MIN_LABEL_FONT_PT = 8;

export interface DotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedTextZone extends DotRect {
  id: LabelTextZoneId;
  minFontPt: number;
  maxFontPt: number;
  maxLines: number;
  align: LabelTextZone['align'];
  required: boolean;
}

export interface ResolvedQrZone extends DotRect {
  content: DotRect;
  quietMargin: number;
}

export interface ResolvedLabelLayout {
  templateId: LabelTemplate['id'];
  width: number;
  height: number;
  dpi: number;
  rotationDegrees: 0 | 90;
  textZones: readonly ResolvedTextZone[];
  qr: ResolvedQrZone;
}

export interface FittedText {
  fontSizePt: number;
  lines: readonly string[];
  truncated: boolean;
  fits: boolean;
}

export function millimetersToDots(millimeters: number, dpi = DEFAULT_PRINTER_DPI): number {
  return Math.round((millimeters / 25.4) * dpi);
}

export function pointsToDots(points: number, dpi = DEFAULT_PRINTER_DPI): number {
  return (points / 72) * dpi;
}

export function resolveLabelTemplate(
  template: LabelTemplate,
  dpi = DEFAULT_PRINTER_DPI,
  orientation: 'landscape' | 'printer' = 'landscape',
): ResolvedLabelLayout {
  const textZones = template.textZones.map((zone) => resolveTextZone(zone, template, dpi, orientation));
  const qr = resolveQrZone(template.qr, template, dpi, orientation);
  return {
    templateId: template.id,
    width: millimetersToDots(orientation === 'printer' ? template.heightMm : template.widthMm, dpi),
    height: millimetersToDots(orientation === 'printer' ? template.widthMm : template.heightMm, dpi),
    dpi,
    rotationDegrees: orientation === 'printer' ? 90 : 0,
    textZones,
    qr,
  };
}

export function fitTextToZone(
  text: string,
  zone: ResolvedTextZone,
  dpi = DEFAULT_PRINTER_DPI,
): FittedText {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { fontSizePt: zone.minFontPt, lines: [], truncated: false, fits: true };
  }

  for (let fontSizePt = zone.maxFontPt; fontSizePt >= zone.minFontPt; fontSizePt -= 0.25) {
    const result = wrapText(normalized, zone.width, zone.height, zone.maxLines, fontSizePt, dpi, false);
    if (result.fits) return { ...result, fontSizePt };
  }

  const result = wrapText(
    normalized,
    zone.width,
    zone.height,
    zone.maxLines,
    zone.minFontPt,
    dpi,
    true,
  );
  return { ...result, fontSizePt: zone.minFontPt };
}

export function validateTemplate(template: LabelTemplate): readonly string[] {
  const errors: string[] = [];
  const safeLeft = template.safeMarginMm;
  const safeTop = template.safeMarginMm;
  const safeRight = template.widthMm - template.safeMarginMm;
  const safeBottom = template.heightMm - template.safeMarginMm;
  const rectangles = [
    ...template.textZones.map((zone) => ({
      id: zone.id,
      xMm: zone.xMm,
      yMm: zone.yMm,
      widthMm: zone.widthMm,
      heightMm: zone.heightMm,
    })),
    { id: 'qr', xMm: template.qr.xMm, yMm: template.qr.yMm, widthMm: template.qr.sizeMm, heightMm: template.qr.sizeMm },
  ];

  for (const rectangle of rectangles) {
    if (
      rectangle.xMm < safeLeft ||
      rectangle.yMm < safeTop ||
      rectangle.xMm + rectangle.widthMm > safeRight ||
      rectangle.yMm + rectangle.heightMm > safeBottom
    ) {
      errors.push(`${rectangle.id} exceeds the ${template.safeMarginMm} mm safe area`);
    }
  }
  for (const zone of template.textZones) {
    if (zone.minFontPt < MIN_LABEL_FONT_PT) errors.push(`${zone.id} is below ${MIN_LABEL_FONT_PT} pt`);
    if (zone.minFontPt > zone.maxFontPt) errors.push(`${zone.id} has an inverted font range`);
  }
  if (template.qr.sizeMm - template.qr.quietMarginMm * 2 < 14) {
    errors.push('qr content is below 14 mm');
  }
  for (let first = 0; first < rectangles.length; first += 1) {
    for (let second = first + 1; second < rectangles.length; second += 1) {
      const a = rectangles[first];
      const b = rectangles[second];
      if (a && b && overlaps(a, b)) errors.push(`${a.id} overlaps ${b.id}`);
    }
  }
  return errors;
}

function resolveTextZone(
  zone: LabelTextZone,
  template: LabelTemplate,
  dpi: number,
  orientation: 'landscape' | 'printer',
): ResolvedTextZone {
  const rect = resolveRect(zone, template, dpi, orientation);
  return { ...rect, id: zone.id, minFontPt: zone.minFontPt, maxFontPt: zone.maxFontPt, maxLines: zone.maxLines, align: zone.align, required: zone.required };
}

function resolveQrZone(
  zone: LabelQrZone,
  template: LabelTemplate,
  dpi: number,
  orientation: 'landscape' | 'printer',
): ResolvedQrZone {
  const outer = resolveRect(
    { xMm: zone.xMm, yMm: zone.yMm, widthMm: zone.sizeMm, heightMm: zone.sizeMm },
    template,
    dpi,
    orientation,
  );
  const quietMargin = millimetersToDots(zone.quietMarginMm, dpi);
  return {
    ...outer,
    quietMargin,
    content: {
      x: outer.x + quietMargin,
      y: outer.y + quietMargin,
      width: outer.width - quietMargin * 2,
      height: outer.height - quietMargin * 2,
    },
  };
}

function resolveRect(
  rect: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  template: LabelTemplate,
  dpi: number,
  orientation: 'landscape' | 'printer',
): DotRect {
  if (orientation === 'printer') {
    return {
      x: millimetersToDots(template.heightMm - rect.yMm - rect.heightMm, dpi),
      y: millimetersToDots(rect.xMm, dpi),
      width: millimetersToDots(rect.heightMm, dpi),
      height: millimetersToDots(rect.widthMm, dpi),
    };
  }
  return {
    x: millimetersToDots(rect.xMm, dpi),
    y: millimetersToDots(rect.yMm, dpi),
    width: millimetersToDots(rect.widthMm, dpi),
    height: millimetersToDots(rect.heightMm, dpi),
  };
}

function wrapText(
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxLines: number,
  fontSizePt: number,
  dpi: number,
  truncate: boolean,
): Omit<FittedText, 'fontSizePt'> {
  const fontDots = pointsToDots(fontSizePt, dpi);
  const lineHeight = fontDots * 1.16;
  const allowedLines = Math.min(maxLines, Math.floor(maxHeight / lineHeight));
  if (allowedLines < 1) return { lines: [], truncated: true, fits: false };

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidth(candidate, fontDots) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    while (estimateTextWidth(current, fontDots) > maxWidth && current.length > 1) {
      let cut = current.length - 1;
      while (cut > 1 && estimateTextWidth(current.slice(0, cut), fontDots) > maxWidth) cut -= 1;
      lines.push(current.slice(0, cut));
      current = current.slice(cut);
    }
  }
  if (current) lines.push(current);

  const overflow = lines.length > allowedLines;
  if (!overflow) return { lines, truncated: false, fits: true };
  if (!truncate) return { lines, truncated: false, fits: false };

  const visible = lines.slice(0, allowedLines);
  const lastIndex = visible.length - 1;
  let last = visible[lastIndex] ?? '';
  while (last && estimateTextWidth(`${last}…`, fontDots) > maxWidth) last = last.slice(0, -1);
  visible[lastIndex] = `${last.trimEnd()}…`;
  return { lines: visible, truncated: true, fits: true };
}

function estimateTextWidth(text: string, fontDots: number): number {
  return [...text].reduce((width, character) => {
    if (character === ' ') return width + fontDots * 0.32;
    if ('ilI1.,:/'.includes(character)) return width + fontDots * 0.3;
    if ('MW@%'.includes(character)) return width + fontDots * 0.85;
    if (character === character.toUpperCase()) return width + fontDots * 0.62;
    return width + fontDots * 0.55;
  }, 0);
}

function overlaps(
  a: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  b: { xMm: number; yMm: number; widthMm: number; heightMm: number },
): boolean {
  return !(
    a.xMm + a.widthMm <= b.xMm ||
    b.xMm + b.widthMm <= a.xMm ||
    a.yMm + a.heightMm <= b.yMm ||
    b.yMm + b.heightMm <= a.yMm
  );
}
