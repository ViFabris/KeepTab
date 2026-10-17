import type { LabelOption } from '../types';

const EXCLUSIVE_FORM_GROUPS = [
  new Set(['form.whole', 'form.cut', 'form.shredded']),
  new Set(['form.cooked', 'form.raw']),
  new Set(['form.inShell', 'form.peeled']),
  new Set(['form.opened', 'form.unopened']),
];

export function nextFormSelection(
  currentIds: string[],
  chosen: LabelOption,
  allFormOptions: LabelOption[],
  singleSelection: boolean,
): string[] {
  if (currentIds.includes(chosen.id)) {
    return currentIds.filter((id) => id !== chosen.id);
  }
  if (singleSelection) return [chosen.id];

  const chosenKey = chosen.translationKey;
  const chosenIsOther = chosenKey === 'form.other';
  const conflictingKeys = EXCLUSIVE_FORM_GROUPS.find((group) => chosenKey && group.has(chosenKey));
  const optionById = new Map(allFormOptions.map((option) => [option.id, option]));

  return [
    ...currentIds.filter((id) => {
      const currentKey = optionById.get(id)?.translationKey;
      if (chosenIsOther || currentKey === 'form.other') return false;
      return !currentKey || !conflictingKeys?.has(currentKey);
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
