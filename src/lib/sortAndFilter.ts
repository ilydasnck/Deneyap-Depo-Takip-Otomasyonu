import type { InventoryItem, SortOption, StockFilter } from '@/types/inventory';
import { getStockLevel } from '@/lib/stockHelpers';
import { matchesSearch } from '@/lib/stringSearch';

export function filterByStock(items: InventoryItem[], filter: StockFilter): InventoryItem[] {
  if (filter === 'all') return items;
  return items.filter((it) => {
    const l = getStockLevel(it.quantity);
    if (filter === 'in_stock') return l === 'in_stock';
    if (filter === 'low') return l === 'low_stock';
    return l === 'out_of_stock';
  });
}

export function filterByText(
  items: InventoryItem[],
  query: string,
): InventoryItem[] {
  if (!query.trim()) return items;
  return items.filter(
    (it) =>
      matchesSearch(it.productName, query) ||
      matchesSearch(String(it.shelfId), query) ||
      matchesSearch(`#${it.shelfId}`, query),
  );
}

export function sortItems(items: InventoryItem[], sort: SortOption): InventoryItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return a.productName.localeCompare(b.productName, 'tr');
      case 'name_desc':
        return b.productName.localeCompare(a.productName, 'tr');
      case 'shelf_asc':
        return a.shelfId - b.shelfId;
      case 'shelf_desc':
        return b.shelfId - a.shelfId;
      case 'qty_asc':
        return a.quantity - b.quantity;
      case 'qty_desc':
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });
  return copy;
}
