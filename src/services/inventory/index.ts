export type { InventoryRepository } from '@/services/inventory/repository';
export { getInventoryRepository } from '@/services/inventory/localStorageInventoryRepository';
export {
  fetchWarehouseJson,
  seedInventoryFromWarehouseJson,
} from '@/services/inventory/seedFromJson';
