export type StorageType = 'Refrigerated' | 'Frozen';

export type Language = 'pt-BR' | 'en';

export type DateOrder = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export type TimeFormat = '12h' | '24h';

export type Jurisdiction = 'RS' | 'OTHER';

export type VerificationMode = 'strict' | 'test';

export type VerificationStatus = 'unverified' | 'verified';

export type PlantBasedType = 'none' | 'drink' | 'food';

export type TemperatureClass = 'refrigerated' | 'frozen' | 'ambient';

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
  temperatureClass?: TemperatureClass | null;
}

export interface ItemLabelOption extends LabelOption {
  isDefault: boolean;
  preparedFood?: boolean;
}

export interface KitchenItem {
  id: string;
  name: string;
  storageOptions: ItemLabelOption[];
  formOptions: ItemLabelOption[];
  plantBasedType: PlantBasedType;
  heatTreated: boolean;
  verificationStatus: VerificationStatus;
  verifiedBy: string;
  verifiedOn: string;
  manufacturerDaysAfterOpen: number | null;
  source: string;
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
  jurisdiction: Jurisdiction;
  fridgeAtOrBelow4C: boolean;
  reducedMaximumDays: number;
  verificationMode: VerificationMode;
  legalNoticeSeen: boolean;
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
  dateKind?: 'prepared' | 'opened';
  useByAt: string;
  staffId: number;
  staffName: string;
  labelWidthMm: number;
  labelHeightMm: number;
  testOnly?: boolean;
  jurisdictions?: string[];
  rulesVersion?: string;
  cappedByRuleId?: string | null;
  itemVerificationStatus?: VerificationStatus;
  verificationMode?: VerificationMode;
  printerProfileSnapshot?: PrinterProfile;
  appVersion?: string;
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

