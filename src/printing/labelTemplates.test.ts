import { describe, expect, it } from 'vitest';

import {
  fitTextToZone,
  MIN_LABEL_FONT_PT,
  resolveLabelTemplate,
  validateTemplate,
} from './labelLayout';
import {
  findNearestLabelTemplate,
  isTemplateAvailable,
  LABEL_TEMPLATES,
} from './labelTemplates';

describe('label templates', () => {
  it('defines the three requested landscape sizes', () => {
    expect(LABEL_TEMPLATES.map(({ id, widthMm, heightMm }) => ({ id, widthMm, heightMm }))).toEqual([
      { id: 'small', widthMm: 50, heightMm: 30 },
      { id: 'medium', widthMm: 80, heightMm: 50 },
      { id: 'large', widthMm: 100, heightMm: 75 },
    ]);
  });

  it('keeps every zone inside the safe area without overlaps', () => {
    for (const template of LABEL_TEMPLATES) expect(validateTemplate(template)).toEqual([]);
  });

  it('keeps all text at or above 8 pt and USE BY at least as large as every other field', () => {
    for (const template of LABEL_TEMPLATES) {
      const useBy = template.textZones.find((zone) => zone.id === 'useByValue');
      expect(useBy?.minFontPt).toBeGreaterThanOrEqual(MIN_LABEL_FONT_PT);
      for (const zone of template.textZones) {
        expect(zone.minFontPt).toBeGreaterThanOrEqual(MIN_LABEL_FONT_PT);
        if (zone.id !== 'useByValue') expect(useBy?.minFontPt).toBeGreaterThanOrEqual(zone.maxFontPt);
      }
    }
  });

  it('fits or safely ellipsizes worst-case bilingual text inside every text zone', () => {
    const worstCase = 'RECIPIENTES GRANDES E CUBAS EXTRAORDINARIAMENTE LONGOS';
    for (const template of LABEL_TEMPLATES) {
      const layout = resolveLabelTemplate(template);
      for (const zone of layout.textZones) {
        const fitted = fitTextToZone(worstCase, zone);
        expect(fitted.fits).toBe(true);
        expect(fitted.fontSizePt).toBeGreaterThanOrEqual(MIN_LABEL_FONT_PT);
        expect(fitted.lines.length).toBeLessThanOrEqual(zone.maxLines);
      }
    }
  });

  it('maps old custom sizes to the nearest preset without changing saved labels', () => {
    expect(findNearestLabelTemplate(60, 40).id).toBe('small');
    expect(findNearestLabelTemplate(82, 49).id).toBe('medium');
    expect(findNearestLabelTemplate(75, 100).id).toBe('large');
  });

  it('uses the shorter side when checking print-head availability', () => {
    expect(LABEL_TEMPLATES.map((template) => isTemplateAvailable(template, 104))).toEqual([true, true, true]);
    expect(LABEL_TEMPLATES.map((template) => isTemplateAvailable(template, 40))).toEqual([true, false, false]);
  });

  it('rotates the landscape page for the printer without changing its physical size', () => {
    const layout = resolveLabelTemplate(LABEL_TEMPLATES[1]!, 203, 'printer');
    expect(layout.rotationDegrees).toBe(90);
    expect(layout.width).toBeLessThan(layout.height);
  });
});
