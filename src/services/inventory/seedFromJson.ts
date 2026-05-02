import { normalizeTr, seedItemId } from '@/lib/stableId';
import type { InventoryItem } from '@/types/inventory';
import type { WarehouseJsonShelf } from '@/types/warehouseJson';

export function seedInventoryFromWarehouseJson(
  shelves: WarehouseJsonShelf[],
): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const shelf of shelves) {
    shelf.urunler.forEach((u, indexOnShelf) => {
      const url = u.fotograf?.trim();
      items.push({
        id: seedItemId(shelf.raf_no, u.ad, indexOnShelf),
        shelfId: shelf.raf_no,
        productName: u.ad,
        quantity: 0,
        quantityRecorded: false,
        category: shelf.kategori?.trim() || undefined,
        imageUrl: url ? url : undefined,
      });
    });
  }
  return items;
}

export async function fetchWarehouseJson(): Promise<WarehouseJsonShelf[]> {
  const res = await fetch('/urunler.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('urunler.json yüklenemedi');
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error('Geçersiz JSON');
  return data as WarehouseJsonShelf[];
}

/** localStorage’taki stok miktarlarını korur; aynı ürün id’si için görselleri güncel JSON’dan alır. */
export function mergeWarehouseJsonIntoItems(
  saved: InventoryItem[],
  shelves: WarehouseJsonShelf[],
): InventoryItem[] {
  const seeded = seedInventoryFromWarehouseJson(shelves);
  const seedById = new Map(seeded.map((it) => [it.id, it]));

  const merged: InventoryItem[] = saved.map((it) => {
    const seed = seedById.get(it.id);
    if (!seed) return it;
    const jsonImage = seed.imageUrl?.trim();
    const jsonCat = seed.category?.trim();
    return {
      ...it,
      category:
        jsonCat && jsonCat.length > 0 ? jsonCat : it.category,
      imageUrl:
        jsonImage && jsonImage.length > 0 ? jsonImage : it.imageUrl,
    };
  });

  const savedIds = new Set(saved.map((i) => i.id));
  for (const s of seeded) {
    if (!savedIds.has(s.id)) merged.push(s);
  }

  return enrichMissingImagesFromCatalog(merged, shelves);
}

/** Yeni eklenen (UUID) kayıtlarda görsel boşsa, aynı raf + ürün adı katalogda varsa fotograf kullanılır — diğer cihazlar urunler.json ile görür. */
/** Raf + ürün adı için boşluktan bağımsız eşleme (yazım farkları azalır) */
function catalogNameKey(shelfId: number, rawName: string): string {
  const compact = normalizeTr(rawName).replace(/\s+/g, '');
  return `${shelfId}::${compact}`;
}

export function enrichMissingImagesFromCatalog(
  items: InventoryItem[],
  shelves: WarehouseJsonShelf[],
): InventoryItem[] {
  const byShelfAndName = new Map<string, string>();
  for (const shelf of shelves) {
    for (const u of shelf.urunler) {
      const foto = u.fotograf?.trim();
      if (!foto) continue;
      const key = catalogNameKey(shelf.raf_no, u.ad);
      if (!byShelfAndName.has(key)) byShelfAndName.set(key, foto);
    }
  }
  return items.map((it) => {
    if (it.imageUrl?.trim()) return it;
    const foto = byShelfAndName.get(catalogNameKey(it.shelfId, it.productName));
    if (foto) return { ...it, imageUrl: foto };
    return it;
  });
}
