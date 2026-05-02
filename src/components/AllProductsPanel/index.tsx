import { useEffect, useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import type { InventoryItem, SortOption, StockFilter } from '@/types/inventory';
import { countByStockLevelVisitor } from '@/lib/stockHelpers';
import {
  hasUncategorizedItems,
  UNCATEGORIZED_FILTER,
  uniqueSortedCategories,
} from '@/lib/categoryUtils';
import {
  filterByCategory,
  filterByStock,
  filterByText,
  sortItems,
} from '@/lib/sortAndFilter';
import StockBadge from '@/components/StockBadge';

type Props = {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onProductSelect?: (item: InventoryItem) => void;
};

const stockFilterLabels: Record<StockFilter, string> = {
  all: 'Tümü',
  in_stock: 'Stokta',
  low: 'Düşük',
  out: 'Tükendi',
};

const sortLabels: Record<SortOption, string> = {
  name_asc: 'İsim (A-Z)',
  name_desc: 'İsim (Z-A)',
  shelf_asc: 'Raf No (Küçük → Büyük)',
  shelf_desc: 'Raf No (Büyük → Küçük)',
  qty_asc: 'Adet (Az → Çok)',
  qty_desc: 'Adet (Çok → Az)',
};

export default function AllProductsPanel({
  open,
  onClose,
  items,
  onProductSelect,
}: Props) {
  const [q, setQ] = useState('');
  const [stock, setStock] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortOption>('name_asc');
  const [category, setCategory] = useState<'all' | string>('all');

  const categoryNames = useMemo(() => uniqueSortedCategories(items), [items]);
  const showUncategorizedOpt = useMemo(() => hasUncategorizedItems(items), [items]);

  const processed = useMemo(() => {
    let list = filterByText(items, q);
    list = filterByCategory(list, category);
    list = filterByStock(list, stock);
    list = sortItems(list, sort);
    return list;
  }, [items, q, stock, sort, category]);

  const counts = useMemo(() => countByStockLevelVisitor(processed), [processed]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-products-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default bg-transparent"
        aria-label="Paneli kapat"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-6xl rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-2xl dark:border-slate-600 dark:bg-slate-900/95 sm:p-6 lg:max-w-7xl 2xl:max-w-[min(100%,92rem)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Filter className="h-6 w-6" aria-hidden />
              <h2 id="all-products-title" className="text-xl font-bold sm:text-2xl">
                Tüm Ürünler
              </h2>
            </div>
            <p className="mt-1 text-base text-zinc-600 dark:text-slate-400">
              {processed.length} ürün listeleniyor · Stokta: {counts.inStock} · Düşük:{' '}
              {counts.low} · Tükendi: {counts.out}
              {counts.unspecified > 0 ? (
                <>
                  {' '}
                  · Belirtilmedi: {counts.unspecified}
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Ara
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün, kategori veya raf no..."
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Kategori
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="all">Tümü</option>
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
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Stok Durumu
            <select
              value={stock}
              onChange={(e) => setStock(e.target.value as StockFilter)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              {(Object.keys(stockFilterLabels) as StockFilter[]).map((k) => (
                <option key={k} value={k}>
                  {stockFilterLabels[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Sırala
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
            >
              {(Object.keys(sortLabels) as SortOption[]).map((k) => (
                <option key={k} value={k}>
                  {sortLabels[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1 scroll-area-themed">
          {processed.map((it) => {
            const rowClass =
              'flex w-full flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-left shadow-sm transition hover:border-zinc-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:flex-row sm:items-center sm:justify-between';
            const focusClass =
              'focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500/40';
            const inner = (
              <>
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-slate-600 dark:bg-slate-900">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{it.productName}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-violet-700 dark:text-violet-300">
                      {it.category?.trim() ? it.category : 'Kategori yok'}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-lg font-medium text-zinc-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden>📍</span>
                        Raf #{it.shelfId}
                      </span>
                    </p>
                  </div>
                </div>
                <StockBadge item={it} />
              </>
            );
            return (
              <li key={it.id}>
                {onProductSelect ? (
                  <button
                    type="button"
                    onClick={() => onProductSelect(it)}
                    className={`${rowClass} ${focusClass}`}
                  >
                    {inner}
                  </button>
                ) : (
                  <div className={rowClass}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
