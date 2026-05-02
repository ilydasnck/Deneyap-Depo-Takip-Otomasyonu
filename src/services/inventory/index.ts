export type { InventoryRepository } from '@/services/inventory/repository';
export { getInventoryRepository, useFirebaseInventory } from '@/services/inventory/repositoryFactory';
export {
  fetchWarehouseJson,
  seedInventoryFromWarehouseJson,
} from '@/services/inventory/seedFromJson';
