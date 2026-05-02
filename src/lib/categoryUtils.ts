import type { InventoryItem } from '@/types/inventory';

/** Filtre seçiminde "kategori girilmemiş" ürünler */
export const UNCATEGORIZED_FILTER = '__uncategorized__';

export function uniqueSortedCategories(items: InventoryItem[]): string[] {
  const s = new Set<string>();
  for (const it of items) {
    const c = it.category?.trim();
    if (c) s.add(c);
  }
  return [...s].sort((a, b) => a.localeCompare(b, 'tr'));
}

export function hasUncategorizedItems(items: InventoryItem[]): boolean {
  return items.some((it) => !it.category?.trim());
}

export function matchesCategoryFilter(
  item: InventoryItem,
  filter: 'all' | string,
): boolean {
  if (filter === 'all') return true;
  if (filter === UNCATEGORIZED_FILTER) return !item.category?.trim();
  return (item.category ?? '').trim() === filter;
}

/** Listeleme / rozet metni */
export function categoryDisplayLabel(category: string | undefined): string {
  const c = category?.trim();
  return c && c.length > 0 ? c : '—';
}
