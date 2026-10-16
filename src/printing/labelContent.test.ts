import { describe, expect, it } from 'vitest';

import { getCopy } from '../i18n';
import type { AppSettings, Language } from '../types';
import { buildFittedLabelFields, getInitials } from './labelContent';
import { MIN_LABEL_FONT_PT } from './labelLayout';
import { LABEL_TEMPLATES } from './labelTemplates';

const MADE_AT = '2026-10-16T20:45:00.000Z';
const USE_BY_AT = '2026-12-31T23:59:00.000Z';

describe('label content fitting', () => {
  it.each(['en', 'pt-BR'] as const)(
    'fits required date fields in every preset for %s',
    (language) => {
      for (const template of LABEL_TEMPLATES) {
        const copy = getCopy(language);
        const fields = buildFittedLabelFields({
          template,
          language,
          settings: settingsFor(language, template.widthMm, template.heightMm),
          label: {
            itemName: copy.labelSizes.customItemValue,
            form: 'In shell',
            storageType: 'Frozen',
            madeAt: MADE_AT,
            useByAt: USE_BY_AT,
            staffName: 'Alexandra Maximiliana de Albuquerque-Wellington',
          },
        });
        for (const field of fields) {
          expect(field.fits).toBe(true);
          expect(field.fontSizePt).toBeGreaterThanOrEqual(MIN_LABEL_FONT_PT);
        }
        expect(fields.find((field) => field.id === 'useByValue')?.truncated).toBe(false);
        expect(
          fields.find((field) => field.id === 'madeValue')?.truncated,
          `${template.id} made date`,
        ).toBe(false);
      }
    },
  );

  it('uses initials and the frozen symbol when Small cannot fit the detail line', () => {
    const template = LABEL_TEMPLATES[0]!;
    const fields = buildFittedLabelFields({
      template,
      language: 'pt-BR',
      settings: settingsFor('pt-BR', template.widthMm, template.heightMm),
      label: {
        itemName: 'Molho artesanal de pimentões assados com ervas frescas',
        form: 'Uma descrição de preparo muito longa',
        storageType: 'Frozen',
        madeAt: MADE_AT,
        useByAt: USE_BY_AT,
        staffName: 'Ana Beatriz Costa',
      },
    });
    expect(fields.find((field) => field.id === 'staff')?.text).toBe('ABC');
    expect(fields.find((field) => field.id === 'formStorage')?.text).toBe('❄');
  });

  it('creates at most three initials', () => {
    expect(getInitials('Ana Beatriz Costa de Souza')).toBe('ABC');
  });
});

function settingsFor(language: Language, labelWidthMm: number, labelHeightMm: number): AppSettings {
  return {
    language,
    dateOrder: language === 'pt-BR' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
    timeFormat: language === 'pt-BR' ? '24h' : '12h',
    spellOutMonth: true,
    timeZone: 'America/Sao_Paulo',
    clockOffsetMs: 0,
    labelWidthMm,
    labelHeightMm,
    setupComplete: true,
  };
}
