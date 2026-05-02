import type { InventoryItem } from '@/types/inventory';

export interface InventoryRepository {
  loadItems(): InventoryItem[] | null;
  saveItems(items: InventoryItem[]): void;
}
