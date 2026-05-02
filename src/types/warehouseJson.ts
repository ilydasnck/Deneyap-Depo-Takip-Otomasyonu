export interface WarehouseJsonProduct {
  ad: string;
  fotograf: string;
}

export interface WarehouseJsonShelf {
  raf_no: number;
  kategori: string;
  urunler: WarehouseJsonProduct[];
}
