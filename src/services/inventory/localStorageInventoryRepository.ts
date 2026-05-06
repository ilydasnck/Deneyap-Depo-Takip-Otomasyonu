import type { InventoryItem } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/services/inventory/constants';
import type { InventoryRepository } from '@/services/inventory/repository';

export class LocalStorageInventoryRepository implements InventoryRepository {
  async loadItems(): Promise<InventoryItem[] | null> {
    try {
      const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
      /** Boş depo `[]` olmalı; `null` dönmemeli — üst katman `null`ı yükleme hatası sanıyordu. */
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed as InventoryItem[];
    } catch {
      return [];
    }
  }

  async saveItems(items: InventoryItem[]): Promise<void> {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  }
}

let singleton: InventoryRepository | null = null;

export function getLocalStorageInventoryRepository(): InventoryRepository {
  if (!singleton) singleton = new LocalStorageInventoryRepository();
  return singleton;
}
