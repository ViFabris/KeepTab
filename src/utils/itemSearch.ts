import type { KitchenItem } from '../types';
import type { Language } from '../types';
import { getItemName } from '../i18n';

export function filterItems(
  items: KitchenItem[],
  query: string,
  language: Language = 'en',
): KitchenItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter((item) => {
    const localizedName = getItemName(item.id, item.name, language);
    return `${localizedName} ${item.name}`.toLocaleLowerCase().includes(normalized);
  });
}
