import { MapPin } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { isVisitorStockUnspecified } from '@/lib/stockHelpers';

type Props = {
  item: InventoryItem;
  onSelect: () => void;
};

export default function SearchResultCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-xl bg-white p-4 text-left shadow-md ring-1 ring-zinc-100',
        'transition hover:ring-2 hover:ring-[#B71C1C]/25 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#B71C1C]/40',
        'dark:bg-slate-900 dark:shadow-lg dark:ring-slate-700 dark:hover:ring-[#B71C1C]/35',
        'sm:p-5',
      ].join(' ')}
    >
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200 dark:bg-slate-800 dark:ring-slate-600">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
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
          <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl dark:text-slate-50">
            {item.productName}
          </h3>
          <p className="mt-2 text-base font-medium text-violet-700 dark:text-violet-300">
            {item.category?.trim() ? item.category : 'Kategori belirtilmedi'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-lg font-bold text-white shadow-sm">
              <MapPin className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
              Raf #{item.shelfId}
            </span>
            <span
              className={[
                'inline-flex items-center rounded-lg px-3.5 py-2 text-lg ring-1',
                isVisitorStockUnspecified(item)
                  ? 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-600'
                  : 'bg-slate-50 ring-slate-100 dark:bg-slate-800 dark:ring-slate-600',
              ].join(' ')}
            >
              <span className="text-slate-600 dark:text-slate-400">Stok: </span>
              <span
                className={
                  isVisitorStockUnspecified(item)
                    ? 'font-semibold text-slate-500 dark:text-slate-400'
                    : 'font-bold text-amber-600 dark:text-amber-400'
                }
              >
                {isVisitorStockUnspecified(item) ? 'Belirtilmedi' : item.quantity}
              </span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
