import { useMemo } from 'react';
import type { InventoryItem } from '@/types/inventory';
import { SHELF_COUNT } from '@/types/inventory';
import { matchesSearch } from '@/lib/stringSearch';

type Props = {
  items: InventoryItem[];
  filter: string;
  onAdd: (shelfId: number) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
};

export default function ShelfTable({ items, filter, onAdd, onEdit, onDelete }: Props) {
  const byShelf = useMemo(() => {
    const map = new Map<number, InventoryItem[]>();
    for (let s = 1; s <= SHELF_COUNT; s++) map.set(s, []);
    for (const it of items) {
      const arr = map.get(it.shelfId);
      if (arr) arr.push(it);
    }
    return map;
  }, [items]);

  const data = useMemo(() => {
    const f = filter.trim();
    if (!f) {
      return Array.from({ length: SHELF_COUNT }, (_, i) => ({
        shelfId: i + 1,
        products: byShelf.get(i + 1) ?? [],
      }));
    }
    const rows: { shelfId: number; products: InventoryItem[] }[] = [];
    for (let s = 1; s <= SHELF_COUNT; s++) {
      const all = byShelf.get(s) ?? [];
      const shelfMatch =
        matchesSearch(String(s), f) ||
        matchesSearch(`#${s}`, f) ||
        matchesSearch(`raf ${s}`, f);
      const prodMatch = all.filter((p) => matchesSearch(p.productName, f));
      if (shelfMatch) rows.push({ shelfId: s, products: all });
      else if (prodMatch.length) rows.push({ shelfId: s, products: prodMatch });
    }
    return rows;
  }, [byShelf, filter]);

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/95 shadow-md dark:border-slate-600 dark:bg-slate-900/80">
      <div className="scroll-area-themed max-h-[min(70vh,640px)] overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-100/95 backdrop-blur dark:bg-slate-800/95">
            <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-slate-400">
              <th className="px-4 py-3 font-semibold">Raf No</th>
              <th className="px-4 py-3 font-semibold">Ürünler</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ shelfId, products }) => {
              const empty = products.length === 0;
              return (
                <tr
                  key={shelfId}
                  className="border-t border-zinc-100 dark:border-slate-700"
                >
                  <td className="px-4 py-3 align-top">
                    <span
                      className={
                        empty
                          ? 'inline-flex rounded-lg bg-zinc-200 px-2 py-1 text-xs font-bold text-zinc-700 dark:bg-slate-700 dark:text-slate-200'
                          : 'inline-flex rounded-lg bg-gradient-to-r from-[#1976D2] to-[#2196F3] px-2 py-1 text-xs font-bold text-white shadow-sm'
                      }
                    >
                      #{shelfId}
                    </span>
                    {!empty ? (
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-slate-400">
                        {products.length} ürün
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {empty ? (
                      <span className="italic text-zinc-500 dark:text-slate-400">Boş raf</span>
                    ) : (
                      <ul className="space-y-2">
                        {products.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-slate-100">
                              {p.productName}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-slate-400">
                              ({p.quantity} adet)
                            </span>
                            <button
                              type="button"
                              onClick={() => onEdit(p)}
                              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(p)}
                              className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                            >
                              Sil
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-600 dark:text-slate-300">
                    {empty ? 'Kullanılmıyor' : 'Dolu'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onAdd(shelfId)}
                      className="rounded-lg bg-gradient-to-r from-[#1976D2] to-[#2196F3] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                    >
                      Ürün Ekle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
