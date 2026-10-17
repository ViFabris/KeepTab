import {
  getCompactStorageLabel,
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
  dateKind?: 'prepared' | 'opened';
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
  const compactStorageName = storageOption?.customLabel
    ? storageName
    : getCompactStorageLabel(storageOption?.legacyValue ?? label.storageType, language);
  const resolved = resolveLabelTemplate(template, settings.printerProfile.dpi);
  const values: Record<LabelTextZoneId, string> = {
    itemName: getItemName(label.itemId ?? '', label.itemName, language),
    formStorage: `${formName} · ${template.id === 'small' ? compactStorageName : storageName}`,
    useByLabel: copy.useBy,
    useByValue: label.useByAt ? formatLabelDate(label.useByAt, settings) : copy.notConfigured,
    madeLabel: label.dateKind === 'opened' ? copy.openedOn : copy.made,
    madeValue: template.id === 'small'
      ? formatCompactLabelDate(label.madeAt, settings)
      : formatLabelUseBy(label.madeAt, settings),
    staff: template.id === 'small' ? label.staffName : copy.madeBy(label.staffName),
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
  const item = label.itemId ?? label.itemName;
  return [
    'KT1',
    compactQrItem(item),
    compactQrDate(label.madeAt),
    label.useByAt ? compactQrDate(label.useByAt) : '-',
  ].join('|');
}

function compactQrItem(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
  if (normalized.length <= 32) return normalized || 'item';

  // Keep unusually long/custom identifiers bounded so the Small template always
  // stays within its fixed QR zone. FNV-1a is deterministic and needs no network.
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return `h${(hash >>> 0).toString(36)}`;
}

function compactQrDate(value: string): string {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return '-';
  return Math.floor(milliseconds / 60_000).toString(36);
}

function isFrozen(label: LabelContentInput, storageOption?: LabelOption): boolean {
  return storageOption?.legacyValue === 'Frozen' || label.storageType === 'Frozen';
}
