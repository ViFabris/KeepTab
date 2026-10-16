import {
  getCopy,
  getFormLabel,
  getItemName,
  getLabelOptionName,
  getStorageLabel,
} from '../i18n';
import type { AppSettings, LabelOption, Language } from '../types';
import {
  formatCompactLabelDate,
  formatLabelDate,
  formatLabelUseBy,
} from '../utils/dates';
import { fitTextToZone, resolveLabelTemplate, type FittedText } from './labelLayout';
import type { LabelTemplate, LabelTextZoneId } from './labelTemplates';

export interface LabelContentInput {
  itemId?: string;
  itemName: string;
  form: string;
  storageType: string;
  madeAt: string;
  useByAt?: string;
  staffName: string;
}

export interface FittedLabelField extends FittedText {
  id: LabelTextZoneId;
  text: string;
}

export function buildFittedLabelFields({
  template,
  label,
  settings,
  language,
  formOption,
  storageOption,
}: {
  template: LabelTemplate;
  label: LabelContentInput;
  settings: AppSettings;
  language: Language;
  formOption?: LabelOption;
  storageOption?: LabelOption;
}): readonly FittedLabelField[] {
  const copy = getCopy(language);
  const formName = formOption
    ? getLabelOptionName(formOption, language)
    : getFormLabel(label.form, language);
  const storageName = storageOption
    ? getLabelOptionName(storageOption, language)
    : getStorageLabel(label.storageType, language);
  const resolved = resolveLabelTemplate(template, settings.printerProfile.dpi);
  const values: Record<LabelTextZoneId, string> = {
    itemName: getItemName(label.itemId ?? '', label.itemName, language),
    formStorage: `${formName} · ${storageName}`,
    useByLabel: copy.useBy,
    useByValue: label.useByAt ? formatLabelDate(label.useByAt, settings) : copy.notConfigured,
    madeLabel: copy.made,
    madeValue: template.id === 'small'
      ? formatCompactLabelDate(label.madeAt, settings)
      : formatLabelUseBy(label.madeAt, settings),
    staff: template.id === 'small' ? getInitials(label.staffName) : copy.madeBy(label.staffName),
  };

  return resolved.textZones.map((zone) => {
    let text = values[zone.id];
    let fitted = fitTextToZone(text, zone, resolved.dpi);
    if (template.id === 'small' && zone.id === 'formStorage' && fitted.truncated) {
      text = isFrozen(label, storageOption) ? '❄' : '';
      fitted = fitTextToZone(text, zone, resolved.dpi);
    }
    return { id: zone.id, text, ...fitted };
  });
}

export function createLabelQrValue(label: LabelContentInput): string {
  return JSON.stringify({
    item: label.itemId ?? label.itemName,
    madeAt: label.madeAt,
    useByAt: label.useByAt ?? null,
  });
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toLocaleUpperCase() ?? '')
    .join('');
}

function isFrozen(label: LabelContentInput, storageOption?: LabelOption): boolean {
  return storageOption?.legacyValue === 'Frozen' || label.storageType === 'Frozen';
}
