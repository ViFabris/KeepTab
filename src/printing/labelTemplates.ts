export type LabelPresetId = 'small' | 'medium' | 'large';

export type LabelTextZoneId =
  | 'itemName'
  | 'formStorage'
  | 'useByLabel'
  | 'useByValue'
  | 'madeLabel'
  | 'madeValue'
  | 'staff';

export type LabelTextAlignment = 'left' | 'center' | 'right';

export interface LabelTextZone {
  id: LabelTextZoneId;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  minFontPt: number;
  maxFontPt: number;
  maxLines: number;
  align: LabelTextAlignment;
  required: boolean;
}

export interface LabelQrZone {
  xMm: number;
  yMm: number;
  sizeMm: number;
  quietMarginMm: number;
}

export interface LabelTemplate {
  id: LabelPresetId;
  widthMm: number;
  heightMm: number;
  safeMarginMm: number;
  textZones: readonly LabelTextZone[];
  qr: LabelQrZone;
}

const SAFE_MARGIN_MM = 2;

export const LABEL_TEMPLATES: readonly LabelTemplate[] = [
  {
    id: 'small',
    widthMm: 50,
    heightMm: 30,
    safeMarginMm: SAFE_MARGIN_MM,
    textZones: [
      zone('itemName', 2, 2, 27, 4.5, 8, 10, 1),
      zone('useByLabel', 2, 6.5, 27, 3.5, 8, 8, 1),
      zone('useByValue', 2, 10, 27, 10, 12, 14, 2),
      zone('madeLabel', 2, 20, 27, 3.5, 8, 8, 1),
      zone('madeValue', 2, 23.5, 21, 4.5, 8, 9, 1),
      zone('staff', 23.5, 23.5, 5.5, 4.5, 8, 9, 1, 'center'),
      zone('formStorage', 30, 24.5, 18, 3.5, 8, 8, 1, 'center', false),
    ],
    qr: { xMm: 30, yMm: 6, sizeMm: 18, quietMarginMm: 1 },
  },
  {
    id: 'medium',
    widthMm: 80,
    heightMm: 50,
    safeMarginMm: SAFE_MARGIN_MM,
    textZones: [
      zone('itemName', 2, 2, 52, 10, 10, 15, 2),
      zone('formStorage', 2, 12.5, 52, 4, 8, 10, 1),
      zone('useByLabel', 2, 17, 52, 3.5, 8, 9, 1),
      zone('useByValue', 2, 20.5, 52, 11, 16, 22, 2),
      zone('madeLabel', 2, 32, 15, 3.5, 8, 9, 1),
      zone('madeValue', 17.5, 32, 36.5, 5, 8, 11, 1),
      zone('staff', 2, 38, 76, 8, 8, 11, 2),
    ],
    qr: { xMm: 56, yMm: 3, sizeMm: 22, quietMarginMm: 1 },
  },
  {
    id: 'large',
    widthMm: 100,
    heightMm: 75,
    safeMarginMm: SAFE_MARGIN_MM,
    textZones: [
      zone('itemName', 2, 2, 66, 15, 12, 20, 2),
      zone('formStorage', 2, 18, 66, 6, 8, 13, 1),
      zone('useByLabel', 2, 25, 66, 5, 8, 11, 1),
      zone('useByValue', 2, 30, 66, 17, 22, 32, 2),
      zone('madeLabel', 2, 49, 18, 5, 8, 11, 1),
      zone('madeValue', 21, 49, 47, 7, 8, 13, 1),
      zone('staff', 2, 58, 96, 13, 8, 15, 2),
    ],
    qr: { xMm: 70, yMm: 4, sizeMm: 28, quietMarginMm: 1 },
  },
] as const;

export function findNearestLabelTemplate(widthMm: number, heightMm: number): LabelTemplate {
  const landscapeWidth = Math.max(widthMm, heightMm);
  const landscapeHeight = Math.min(widthMm, heightMm);
  return LABEL_TEMPLATES.reduce((nearest, candidate) => {
    const nearestDistance = squaredDistance(
      landscapeWidth,
      landscapeHeight,
      nearest.widthMm,
      nearest.heightMm,
    );
    const candidateDistance = squaredDistance(
      landscapeWidth,
      landscapeHeight,
      candidate.widthMm,
      candidate.heightMm,
    );
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}

export function isTemplateAvailable(
  template: LabelTemplate,
  maxPrintableWidthMm: number,
): boolean {
  return Math.min(template.widthMm, template.heightMm) <= maxPrintableWidthMm;
}

function zone(
  id: LabelTextZoneId,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  minFontPt: number,
  maxFontPt: number,
  maxLines: number,
  align: LabelTextAlignment = 'left',
  required = true,
): LabelTextZone {
  return {
    id,
    xMm,
    yMm,
    widthMm,
    heightMm,
    minFontPt,
    maxFontPt,
    maxLines,
    align,
    required,
  };
}

function squaredDistance(
  widthA: number,
  heightA: number,
  widthB: number,
  heightB: number,
): number {
  return (widthA - widthB) ** 2 + (heightA - heightB) ** 2;
}
