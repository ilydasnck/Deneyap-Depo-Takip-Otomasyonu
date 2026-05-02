import type { InventoryItem } from '@/types/inventory';

export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity < 10) return 'low_stock';
  return 'in_stock';
}

export function stockBadgeClass(level: StockLevel): string {
  switch (level) {
    case 'in_stock':
      return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300';
    case 'low_stock':
      return 'bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/35 dark:text-amber-200';
    case 'out_of_stock':
      return 'bg-red-600/15 text-red-800 ring-1 ring-red-600/30 dark:text-red-200';
  }
}

export function formatQuantityTr(quantity: number): string {
  return `${quantity} adet`;
}

/** Ziyaretçi ekranı: yönetici adet girmemiş ve stok 0 → nötr gösterim */
export function isVisitorStockUnspecified(item: InventoryItem): boolean {
  return item.quantityRecorded !== true && item.quantity <= 0;
}

export function visitorUnspecifiedBadgeClass(): string {
  return 'bg-zinc-500/12 text-zinc-600 ring-1 ring-zinc-400/30 dark:text-zinc-300 dark:ring-zinc-500/40';
}

export function formatQuantityVisitor(item: InventoryItem): string {
  if (isVisitorStockUnspecified(item)) return 'Belirtilmedi';
  return formatQuantityTr(item.quantity);
}

export function stockStatusTextVisitor(item: InventoryItem): string {
  if (isVisitorStockUnspecified(item)) return 'Belirtilmedi';
  const level = getStockLevel(item.quantity);
  if (level === 'out_of_stock') return 'Tükendi';
  if (level === 'low_stock') return 'Düşük stok';
  return 'Stokta';
}

export function countByStockLevel(items: InventoryItem[]) {
  let inStock = 0;
  let low = 0;
  let out = 0;
  for (const it of items) {
    const l = getStockLevel(it.quantity);
    if (l === 'in_stock') inStock++;
    else if (l === 'low_stock') low++;
    else out++;
  }
  return { inStock, low, out };
}

/** Ziyaretçi paneli: belirtilmemiş (kayıtsız 0) ayrı sayılır; tükendi yalnızca kayıtlı sıfırlar */
export function countByStockLevelVisitor(items: InventoryItem[]) {
  let inStock = 0;
  let low = 0;
  let out = 0;
  let unspecified = 0;
  for (const it of items) {
    if (isVisitorStockUnspecified(it)) {
      unspecified++;
      continue;
    }
    const l = getStockLevel(it.quantity);
    if (l === 'in_stock') inStock++;
    else if (l === 'low_stock') low++;
    else out++;
  }
  return { inStock, low, out, unspecified };
}

export function countLowStockItems(items: InventoryItem[]): number {
  return items.filter(
    (i) => i.quantityRecorded === true && i.quantity > 0 && i.quantity < 10,
  ).length;
}

export function countUsedShelves(items: InventoryItem[]): number {
  const withStock = new Set<number>();
  for (const it of items) {
    if (it.quantity > 0) withStock.add(it.shelfId);
  }
  return withStock.size;
}
