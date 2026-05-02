import type { InventoryItem } from '@/types/inventory';

export interface InventoryRepository {
  loadItems(): Promise<InventoryItem[] | null>;
  saveItems(items: InventoryItem[]): Promise<void>;
}
