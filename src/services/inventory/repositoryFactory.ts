import type { InventoryRepository } from '@/services/inventory/repository';
import { getFirebaseInventoryRepository } from '@/services/inventory/firebaseInventoryRepository';
import { getLocalStorageInventoryRepository } from '@/services/inventory/localStorageInventoryRepository';

/** Vite .env değerleri bazen farklı yazılır; yalnızca === 'true' kullanmak canlıda yanlışlıkla local moda düşürür. */
export function isFirebaseInventoryEnabled(): boolean {
  const raw = import.meta.env.VITE_USE_FIREBASE as string | boolean | undefined;
  if (raw === true) return true;
  if (raw == null || raw === '') return false;
  const s = String(raw).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

export function useFirebaseInventory(): boolean {
  return isFirebaseInventoryEnabled();
}

let cached: InventoryRepository | null = null;
let cachedMode: boolean | null = null;

/** Ağır işlem yok; her çağrıda mod doğrulanır, böylece .env / HMR sonrası yanlış repo takılı kalmaz. */
export function getInventoryRepository(): InventoryRepository {
  const firebase = isFirebaseInventoryEnabled();
  if (cached && cachedMode === firebase) return cached;
  cachedMode = firebase;
  cached = firebase ? getFirebaseInventoryRepository() : getLocalStorageInventoryRepository();
  return cached;
}

export function getInventoryRepositoryKind(): 'firestore' | 'localStorage' {
  return isFirebaseInventoryEnabled() ? 'firestore' : 'localStorage';
}
