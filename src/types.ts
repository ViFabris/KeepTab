export type StorageType = 'Refrigerated' | 'Frozen';

export type Language = 'pt-BR' | 'en';

export type DateOrder = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export type TimeFormat = '12h' | '24h';

export type OptionKind = 'storage' | 'form';

export type LabelStatus = 'active' | 'used' | 'thrown_away';

export interface SelectableOption<T extends string> {
  value: T;
  isDefault: boolean;
}

export interface LabelOption {
  id: string;
  kind: OptionKind;
  translationKey: string | null;
  customLabel: string | null;
  legacyValue: string;
  sortOrder: number;
  appliesToAll: boolean;
}

export interface ItemLabelOption extends LabelOption {
  isDefault: boolean;
}

export interface KitchenItem {
  id: string;
  name: string;
  storageOptions: ItemLabelOption[];
  formOptions: ItemLabelOption[];
}

export interface AppSettings {
  language: Language;
  dateOrder: DateOrder;
  timeFormat: TimeFormat;
  spellOutMonth: boolean;
  timeZone: string;
  clockOffsetMs: number;
  labelWidthMm: number;
  labelHeightMm: number;
  printerProfile: PrinterProfile;
  printerThresholdPercent: number;
  defaultPrintCopies: number;
  setupComplete: boolean;
}

export interface StaffMember {
  id: number;
  name: string;
  createdAt: string;
}

export interface ShelfLife {
  hours: number;
  isPlaceholder: boolean;
  sourceNote: string;
}

export interface PrintableLabel {
  itemId: string;
  itemName: string;
  form: string;
  formOptionId: string | null;
  storageType: string;
  storageOptionId: string | null;
  madeAt: string;
  useByAt: string;
  staffId: number;
  staffName: string;
  labelWidthMm: number;
  labelHeightMm: number;
  testOnly?: boolean;
}

export type SavedLabel = Omit<PrintableLabel, 'staffId'> & {
  id: number;
  staffId: number | null;
  status: LabelStatus;
  printedAt: string;
};

export interface TodayLabelGroups {
  overdue: SavedLabel[];
  today: SavedLabel[];
  nextThreeDays: SavedLabel[];
}
import type { PrinterProfile } from './printing/PrinterProfile';

