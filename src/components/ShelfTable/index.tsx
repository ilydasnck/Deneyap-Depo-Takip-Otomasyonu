import { useMemo, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { SHELF_COUNT } from '@/types/inventory';
import {
  categoryDisplayLabel,
  hasUncategorizedItems,
  matchesCategoryFilter,
  UNCATEGORIZED_FILTER,
  uniqueSortedCategories,
} from '@/lib/categoryUtils';
import { getStockLevel } from '@/lib/stockHelpers';
import { matchesSearch } from '@/lib/stringSearch';

type Props = {
  items: InventoryItem[];
  onAdd: (shelfId: number) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
};

type ShelfScope = 'all' | 'nonempty' | 'empty';
type AdminStockFilter = 'all' | 'awaiting' | 'low' | 'out' | 'good';

function productMatchesStockFilter(p: InventoryItem, f: AdminStockFilter): boolean {
  if (f === 'all') return true;
  const rec = p.quantityRecorded === true;
  const level = getStockLevel(p.quantity);
  if (f === 'awaiting') return !rec;
  if (!rec) return false;
  if (f === 'low') return level === 'low_stock';
  if (f === 'out') return level === 'out_of_stock';
  if (f === 'good') return level === 'in_stock';
  return true;
}

function filterShelfProducts(
  shelfId: number,
  all: InventoryItem[],
  q: string,
  stock: AdminStockFilter,
  category: 'all' | string,
): InventoryItem[] {
  let list = all.filter((p) => matchesCategoryFilter(p, category));
  list =
    stock === 'all' ? list : list.filter((p) => productMatchesStockFilter(p, stock));
  const f = q.trim();
  if (!f) return list;
  const shelfMatch = shelfMatchesSearch(shelfId, f);
  if (shelfMatch) return list;
  return list.filter(
    (p) =>
      matchesSearch(p.productName, f) ||
      matchesSearch(p.category ?? '', f),
  );
}

const shelfScopeLabels: Record<ShelfScope, string> = {
  all: 'Tüm raflar',
  nonempty: 'Yalnızca dolu raflar',
  empty: 'Yalnızca boş raflar',
};

const stockFilterLabels: Record<AdminStockFilter, string> = {
  all: 'Tüm stok durumları',
  awaiting: 'Sayım bekleyen',
  low: 'Düşük stok (1–9)',
  out: 'Tükendi (kayıtlı)',
  good: 'Stok yeterli (10+)',
};

export default function ShelfTable({ items, onAdd, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [shelfScope, setShelfScope] = useState<ShelfScope>('all');
  const [stockFilter, setStockFilter] = useState<AdminStockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  const categoryNames = useMemo(() => uniqueSortedCategories(items), [items]);
  const showUncategorizedOpt = useMemo(() => hasUncategorizedItems(items), [items]);

  const byShelf = useMemo(() => {
    const map = new Map<number, InventoryItem[]>();
    for (let s = 1; s <= SHELF_COUNT; s++) map.set(s, []);
    for (const it of items) {
      const arr = map.get(it.shelfId);
      if (arr) arr.push(it);
    }
    return map;
  }, [items]);

  const shelfIds = useMemo(() => {
    const ids: number[] = [];
    for (let s = 1; s <= SHELF_COUNT; s++) {
      const list = byShelf.get(s) ?? [];
      if (shelfScope === 'nonempty' && list.length === 0) continue;
      if (shelfScope === 'empty' && list.length > 0) continue;
      ids.push(s);
    }
    return ids;
  }, [byShelf, shelfScope]);

  const data = useMemo(() => {
    const rows: { shelfId: number; products: InventoryItem[]; rawCount: number }[] = [];
    for (const shelfId of shelfIds) {
      const raw = byShelf.get(shelfId) ?? [];
      const filtered = filterShelfProducts(
        shelfId,
        raw,
        search,
        stockFilter,
        categoryFilter,
      );

      if (filtered.length > 0) {
        rows.push({ shelfId, products: filtered, rawCount: raw.length });
        continue;
      }
      if (raw.length === 0 && stockFilter === 'all') {
        const q = search.trim();
        if (!q || shelfMatchesSearch(shelfId, q)) {
          rows.push({ shelfId, products: [], rawCount: 0 });
        }
      }
    }
    return rows;
  }, [byShelf, shelfIds, search, stockFilter, categoryFilter]);

  const visibleCount = useMemo(
    () => data.reduce((acc, r) => acc + r.products.length, 0),
    [data],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-sm ring-1 ring-zinc-100/80 dark:border-slate-600 dark:bg-slate-900/75 dark:ring-slate-700/50 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-slate-300">
          <Filter className="h-4 w-4 text-[#1976D2] dark:text-blue-400" aria-hidden />
          Tablo filtreleri
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Ara
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün veya raf no..."
                aria-label="Raf tablosu araması"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Raf listesi
            <select
              value={shelfScope}
              onChange={(e) => setShelfScope(e.target.value as ShelfScope)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              {(Object.keys(shelfScopeLabels) as ShelfScope[]).map((k) => (
                <option key={k} value={k}>
                  {shelfScopeLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400 xl:col-span-2">
            Stok durumu
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as AdminStockFilter)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              {(Object.keys(stockFilterLabels) as AdminStockFilter[]).map((k) => (
                <option key={k} value={k}>
                  {stockFilterLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400 sm:col-span-2 xl:col-span-1">
            Kategori
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="all">Tüm kategoriler</option>
              {showUncategorizedOpt ? (
                <option value={UNCATEGORIZED_FILTER}>Kategori yok</option>
              ) : null}
              {categoryNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-zinc-500 dark:text-slate-500">
          Görünen: <span className="font-semibold text-zinc-700 dark:text-slate-300">{data.length}</span>{' '}
          raf · <span className="font-semibold text-zinc-700 dark:text-slate-300">{visibleCount}</span> ürün
          satırı
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/90 bg-white/95 shadow-md ring-1 ring-zinc-100/70 dark:border-slate-600 dark:bg-slate-900/85 dark:ring-slate-700/40">
        <div className="scroll-area-themed max-h-[min(70vh,720px)] overflow-auto rounded-2xl">
          {data.length === 0 ? (
            <p className="p-8 text-center text-base text-zinc-600 dark:text-slate-400">
              Filtreyle eşleşen raf bulunamadı. Aramayı veya filtreleri güncelleyin.
            </p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-base">
              <thead className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-100/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
                <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                  <th className="px-4 py-3.5">Raf</th>
                  <th className="px-4 py-3.5">Ürünler</th>
                  <th className="px-4 py-3.5">Durum</th>
                  <th className="px-4 py-3.5 text-right sm:text-left">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.map(({ shelfId, products, rawCount }, rowIdx) => {
                  const empty = rawCount === 0;
                  return (
                    <tr
                      key={shelfId}
                      className={[
                        'border-b border-zinc-100 transition-colors dark:border-slate-700/80',
                        rowIdx % 2 === 0
                          ? 'bg-white/80 dark:bg-slate-900/40'
                          : 'bg-zinc-50/50 dark:bg-slate-800/25',
                        'hover:bg-blue-50/40 dark:hover:bg-slate-800/60',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={
                            empty
                              ? 'inline-flex rounded-lg bg-zinc-200 px-2.5 py-1.5 text-sm font-bold text-zinc-700 dark:bg-slate-700 dark:text-slate-200'
                              : 'inline-flex rounded-lg bg-gradient-to-r from-[#1976D2] to-[#2196F3] px-2.5 py-1.5 text-sm font-bold text-white shadow-sm'
                          }
                        >
                          #{shelfId}
                        </span>
                        {!empty ? (
                          <span className="mt-1 block text-sm text-zinc-500 dark:text-slate-400">
                            {rawCount} ürün
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {empty ? (
                          <span className="italic text-zinc-500 dark:text-slate-400">Boş raf</span>
                        ) : (
                          <ul className="space-y-3">
                            {products.map((p) => {
                              const awaiting = p.quantityRecorded !== true;
                              return (
                                <li
                                  key={p.id}
                                  className="flex flex-wrap items-start gap-3 border-b border-zinc-100/80 pb-3 last:border-0 last:pb-0 dark:border-slate-700/60"
                                >
                                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-slate-600 dark:bg-slate-800">
                                    {p.imageUrl ? (
                                      <img
                                        src={p.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400 dark:text-slate-500">
                                        —
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium text-zinc-900 dark:text-slate-100">
                                      {p.productName}
                                    </span>
                                    <span className="ml-2 inline-flex max-w-[min(100%,14rem)] truncate rounded-md bg-violet-500/12 px-2 py-0.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-500/30 dark:text-violet-200">
                                      {categoryDisplayLabel(p.category)}
                                    </span>
                                    {awaiting ? (
                                      <span className="ml-2 inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/35 dark:text-amber-200">
                                        Sayım bekliyor
                                      </span>
                                    ) : null}
                                    <span className="mt-0.5 block text-sm text-zinc-600 dark:text-slate-400">
                                      {awaiting ? (
                                        <>Adet girilmedi — düzenleyerek kaydedin</>
                                      ) : (
                                        <>{p.quantity} adet</>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onEdit(p)}
                                      className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                      Düzenle
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDelete(p)}
                                      className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                                    >
                                      Sil
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-zinc-600 dark:text-slate-300">
                        {empty ? (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-slate-800 dark:text-slate-400">
                            Kullanılmıyor
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/12 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                            Dolu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <button
                          type="button"
                          onClick={() => onAdd(shelfId)}
                          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#1976D2] to-[#2196F3] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        >
                          Ürün Ekle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function shelfMatchesSearch(shelfId: number, q: string): boolean {
  const f = q.trim();
  if (!f) return true;
  return (
    matchesSearch(String(shelfId), f) ||
    matchesSearch(`#${shelfId}`, f) ||
    matchesSearch(`raf ${shelfId}`, f)
  );
}
