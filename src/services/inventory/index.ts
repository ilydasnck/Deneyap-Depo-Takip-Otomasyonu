export type { InventoryRepository } from '@/services/inventory/repository';
export {
  getInventoryRepository,
  getInventoryRepositoryKind,
  isFirebaseInventoryEnabled,
  useFirebaseInventory,
} from '@/services/inventory/repositoryFactory';
