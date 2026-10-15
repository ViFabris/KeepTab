export type StorageType = 'Refrigerated' | 'Frozen';

export type LabelStatus = 'active' | 'used' | 'thrown_away';

export interface SelectableOption<T extends string> {
  value: T;
  isDefault: boolean;
}

export interface KitchenItem {
  id: string;
  name: string;
  storageOptions: SelectableOption<StorageType>[];
  formOptions: SelectableOption<string>[];
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
  storageType: StorageType;
  madeAt: string;
  useByAt: string;
  staffId: number;
  staffName: string;
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
