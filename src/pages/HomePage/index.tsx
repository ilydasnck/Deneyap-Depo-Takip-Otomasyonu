import { useMemo, useState } from 'react';
import {
  filterByCategory,
} from '@/lib/sortAndFilter';
import {
  hasUncategorizedItems,
  UNCATEGORIZED_FILTER,
  uniqueSortedCategories,
} from '@/lib/categoryUtils';
import type { KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import DataSyncNotice from '@/components/DataSyncNotice';
import Layout from '@/components/Layout';
import AllProductsPanel from '@/components/AllProductsPanel';
import ProductDetailModal from '@/components/ProductDetailModal';
import SearchResultCard from '@/components/SearchResultCard';
import StockBadge from '@/components/StockBadge';
import { useInventory } from '@/context/InventoryContext';
import { matchesSearch } from '@/lib/stringSearch';
import { loadRecentSearches, pushRecentSearch } from '@/services/inventory/recentSearches';
import type { InventoryItem } from '@/types/inventory';

const DEFAULT_CHIPS = ['Arduino', 'LED'];

function groupByShelf(items: InventoryItem[]) {
  const map = new Map<number, InventoryItem[]>();
  for (const it of items) {
    const arr = map.get(it.shelfId) ?? [];
    arr.push(it);
    map.set(it.shelfId, arr);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export default function HomePage() {
  const { items, loading, error } = useInventory();
  const [search, setSearch] = useState('');
  const [allOpen, setAllOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [recent, setRecent] = useState<string[]>(() => loadRecentSearches());
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  const categoryNames = useMemo(() => uniqueSortedCategories(items), [items]);
  const showUncategorizedOpt = useMemo(() => hasUncategorizedItems(items), [items]);

  const filtered = useMemo(() => {
    let list = filterByCategory(items, categoryFilter);
    if (!search.trim()) return list;
    return list.filter(
      (it) =>
        matchesSearch(it.productName, search) ||
        matchesSearch(String(it.shelfId), search) ||
        matchesSearch(`raf ${it.shelfId}`, search) ||
        matchesSearch(it.category ?? '', search),
    );
  }, [items, search, categoryFilter]);

  const grouped = useMemo(() => groupByShelf(filtered), [filtered]);

  const searchSorted = useMemo(() => {
    if (!search.trim()) return [];
    return [...filtered].sort(
      (a, b) =>
        a.shelfId - b.shelfId ||
        a.productName.localeCompare(b.productName, 'tr', {
          sensitivity: 'base',
        }),
    );
  }, [filtered, search]);

  const chips = recent.length > 0 ? recent : DEFAULT_CHIPS;

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      pushRecentSearch(search);
      setRecent(loadRecentSearches());
    }
  };

  const applyChip = (text: string) => {
    setSearch(text);
    pushRecentSearch(text);
    setRecent(loadRecentSearches());
  };

  if (loading) {
    return (
      <Layout header={<AppHeader />}>
        <DataSyncNotice />
        <p className="text-center text-lg text-zinc-600 dark:text-slate-300">Yükleniyor…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout header={<AppHeader />}>
        <DataSyncNotice />
        <p className="text-center text-lg text-red-600 dark:text-red-300">{error}</p>
      </Layout>
    );
  }

  return (
    <Layout header={<AppHeader />}>
      <DataSyncNotice />
      <div className="mx-auto flex w-full max-w-none flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="group relative block min-w-0 flex-1">
          <span className="sr-only">Malzeme veya araç ara</span>
          <div
            className={[
              'flex items-center gap-0 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white',
              'shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300',
              'dark:border-slate-600/90 dark:bg-slate-900/85 dark:shadow-[0_12px_40px_rgb(0,0,0,0.35)]',
              'focus-within:border-[#B71C1C]/35 focus-within:shadow-[0_12px_40px_rgba(183,28,28,0.12)]',
              'focus-within:ring-2 focus-within:ring-[#B71C1C]/20 dark:focus-within:border-[#B71C1C]/40',
              'dark:focus-within:shadow-[0_12px_48px_rgba(183,28,28,0.15)]',
            ].join(' ')}
          >
            <span
              className={[
                'flex shrink-0 items-center justify-center self-center pl-4 pr-1 sm:pl-5',
                'text-zinc-400 transition-colors duration-300',
                'group-focus-within:text-[#B71C1C] dark:text-slate-500 dark:group-focus-within:text-[#ef5350]',
              ].join(' ')}
              aria-hidden
            >
              <Search className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
            </span>
            <input
              type="text"
              role="searchbox"
              enterKeyHint="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Malzeme veya araç ara…"
              aria-label="Malzeme veya araç ara"
              className={[
                'min-w-0 flex-1 border-0 bg-transparent py-4 text-lg outline-none',
                'placeholder:text-zinc-400 dark:placeholder:text-slate-500',
                'sm:py-5 sm:text-xl md:text-2xl',
                search ? 'pr-1' : 'pr-4 sm:pr-6',
              ].join(' ')}
              autoComplete="off"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={[
                  'mr-2 flex shrink-0 items-center justify-center rounded-xl p-2.5',
                  'text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700',
                  'dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B71C1C]',
                ].join(' ')}
                aria-label="Aramayı temizle"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </label>

        <div className="flex w-full shrink-0 flex-col gap-1 sm:w-auto sm:min-w-[13rem]">
          <span className="text-sm font-medium text-zinc-600 dark:text-slate-400 sm:sr-only">
            Kategori
          </span>
          <label htmlFor="home-category-filter" className="sr-only">
            Kategori filtresi
          </label>
          <select
            id="home-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={[
              'w-full rounded-2xl border border-zinc-200/90 bg-white px-4 py-3.5 text-base font-medium text-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] outline-none',
              'transition hover:border-zinc-300 focus:border-[#B71C1C]/35 focus:ring-2 focus:ring-[#B71C1C]/20',
              'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_12px_40px_rgb(0,0,0,0.35)]',
              'dark:hover:border-slate-500 dark:focus:border-[#B71C1C]/40 sm:min-h-[4.25rem] sm:py-4 sm:text-lg',
            ].join(' ')}
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
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-none flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="h-8 w-1.5 rounded-full bg-[#B71C1C]" aria-hidden />
            <h2 className="text-xl font-bold tracking-wide text-zinc-800 sm:text-2xl dark:text-slate-100">
              Sık Kullanılanlar
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => applyChip(c)}
                className="rounded-full border border-zinc-200 bg-zinc-100 px-5 py-2.5 text-lg font-medium text-zinc-800 transition hover:bg-zinc-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAllOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:brightness-110"
        >
          Tüm Ürünler
        </button>
      </div>

      <section className="mx-auto mt-10 w-full max-w-none space-y-4" aria-live="polite">
        {search.trim() && searchSorted.length === 0 ? (
          <p className="text-center text-lg text-zinc-600 dark:text-slate-400">Sonuç bulunamadı.</p>
        ) : null}

        {search.trim() ? (
          <ul className="flex w-full flex-col gap-4">
            {searchSorted.map((it) => (
              <li key={it.id}>
                <SearchResultCard item={it} onSelect={() => setDetailItem(it)} />
              </li>
            ))}
          </ul>
        ) : (
          grouped.map(([shelfId, list]) => (
            <article
              key={shelfId}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-md backdrop-blur-md dark:border-slate-600 dark:bg-slate-900/60 sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-zinc-800 sm:text-xl dark:text-slate-100">
                  <span aria-hidden>📍</span>
                  Raf #{shelfId}
                  {list.length > 1 ? (
                    <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-base font-bold text-violet-800 ring-1 ring-violet-500/30 dark:text-violet-200">
                      {list.length} ürün
                    </span>
                  ) : null}
                </div>
              </div>
              <ul className="space-y-3">
                {list.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => setDetailItem(it)}
                      className={[
                        'flex w-full flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/90 p-3 text-left',
                        'transition hover:border-zinc-200 hover:bg-white focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#B71C1C]/35',
                        'sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-slate-600 dark:bg-slate-900">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                              görsel yok
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold">{it.productName}</p>
                          <p className="mt-1 truncate text-sm font-medium text-violet-700 dark:text-violet-300">
                            {it.category?.trim() ? it.category : 'Kategori belirtilmedi'}
                          </p>
                        </div>
                      </div>
                      <StockBadge item={it} />
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>

      {!search.trim() ? (
        <p className="mx-auto mt-10 w-full max-w-none text-center text-base text-zinc-500 dark:text-slate-400 md:text-lg">
          Aramaya başlayın veya &quot;Tüm Ürünler&quot; ile tüm listeyi görüntüleyin.
        </p>
      ) : null}

      <AllProductsPanel
        open={allOpen}
        onClose={() => setAllOpen(false)}
        items={items}
        onProductSelect={(it: InventoryItem) => setDetailItem(it)}
      />

      <ProductDetailModal
        open={detailItem !== null}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </Layout>
  );
}
