import type { InventoryItem } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/services/inventory/constants';
import type { InventoryRepository } from '@/services/inventory/repository';

export class LocalStorageInventoryRepository implements InventoryRepository {
  loadItems(): InventoryItem[] | null {
    try {
      const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      return parsed as InventoryItem[];
    } catch {
      return null;
    }
  }

  saveItems(items: InventoryItem[]): void {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  }
}

let singleton: InventoryRepository | null = null;

export function getInventoryRepository(): InventoryRepository {
  if (!singleton) singleton = new LocalStorageInventoryRepository();
  return singleton;
}
