export interface InventoryItem {
  id: string;
  shelfId: number;
  productName: string;
  quantity: number;
  imageUrl?: string;
}

export type StockFilter = 'all' | 'in_stock' | 'low' | 'out';

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'shelf_asc'
  | 'shelf_desc'
  | 'qty_asc'
  | 'qty_desc';

export const SHELF_COUNT = 84;
