import type { InventoryItem } from '@/types/inventory';

/** Aynı id için iki kaydı birleştirir; Firestore ile yerel yedek arasındaki gecikmelerde daha güncel veriyi korur. */
function mergeTwoInventoryItems(a: InventoryItem, b: InventoryItem): InventoryItem {
  const qty = Math.max(a.quantity, b.quantity);
  const recorded = a.quantityRecorded === true || b.quantityRecorded === true;
  const nameA = a.productName.trim();
  const nameB = b.productName.trim();
  return {
    id: a.id,
    shelfId: a.shelfId,
    productName: nameA.length >= nameB.length ? nameA : nameB,
    quantity: qty,
    quantityRecorded: recorded,
    category: a.category?.trim() || b.category?.trim() || undefined,
    imageUrl: a.imageUrl?.trim() || b.imageUrl?.trim() || undefined,
  };
}

/**
 * Firestore ve yerel yedek listelerini id bazında birleştirir.
 * Önce uzak liste uygulanır, sonra yerelde olup uzakta eksik veya çakışan kayıtlar birleştirilir.
 */
export function combineInventorySources(
  remote: InventoryItem[] | null | undefined,
  local: InventoryItem[] | null | undefined,
): InventoryItem[] {
  const map = new Map<string, InventoryItem>();
  for (const it of remote ?? []) {
    map.set(it.id, it);
  }
  for (const it of local ?? []) {
    const existing = map.get(it.id);
    if (!existing) map.set(it.id, it);
    else map.set(it.id, mergeTwoInventoryItems(existing, it));
  }
  return [...map.values()];
}
