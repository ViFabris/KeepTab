import type { LabelOption } from '../types';

export type FormCategory = 'preparation' | 'cooking' | 'skin' | 'package';

const FORM_CATEGORY_BY_KEY: Record<string, FormCategory> = {
  'form.whole': 'preparation',
  'form.cut': 'preparation',
  'form.shredded': 'preparation',
  'form.other': 'preparation',
  'form.cooked': 'cooking',
  'form.raw': 'cooking',
  'form.inShell': 'skin',
  'form.peeled': 'skin',
  'form.opened': 'package',
  'form.unopened': 'package',
};

export function getFormCategory(option: LabelOption): FormCategory {
  return option.translationKey ? FORM_CATEGORY_BY_KEY[option.translationKey] ?? 'preparation' : 'preparation';
}

export function nextFormSelection(
  currentIds: string[],
  chosen: LabelOption,
  allFormOptions: LabelOption[],
): string[] {
  if (currentIds.includes(chosen.id)) {
    return currentIds.filter((id) => id !== chosen.id);
  }
  const chosenCategory = getFormCategory(chosen);
  const optionById = new Map(allFormOptions.map((option) => [option.id, option]));

  return [
    ...currentIds.filter((id) => {
      const current = optionById.get(id);
      return !current || getFormCategory(current) !== chosenCategory;
    }),
    chosen.id,
  ];
}

export function nextStorageSelection(
  currentIds: string[],
  chosenId: string,
  singleSelection: boolean,
): string[] {
  if (currentIds.includes(chosenId)) {
    return currentIds.filter((id) => id !== chosenId);
  }
  return singleSelection ? [chosenId] : [...currentIds, chosenId];
}
