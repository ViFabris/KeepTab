import type { KitchenItem } from '../types';

export function filterItems(items: KitchenItem[], query: string): KitchenItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter((item) => item.name.toLocaleLowerCase().includes(normalized));
}
