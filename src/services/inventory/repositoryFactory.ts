import type { InventoryRepository } from '@/services/inventory/repository';
import { getFirebaseInventoryRepository } from '@/services/inventory/firebaseInventoryRepository';
import { getLocalStorageInventoryRepository } from '@/services/inventory/localStorageInventoryRepository';

export function useFirebaseInventory(): boolean {
  return import.meta.env.VITE_USE_FIREBASE === 'true';
}

let cached: InventoryRepository | null = null;
let cachedMode: boolean | null = null;

export function getInventoryRepository(): InventoryRepository {
  const firebase = useFirebaseInventory();
  if (cached && cachedMode === firebase) return cached;
  cachedMode = firebase;
  cached = firebase ? getFirebaseInventoryRepository() : getLocalStorageInventoryRepository();
  return cached;
}
