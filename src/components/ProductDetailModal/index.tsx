import { useEffect, useCallback } from 'react';
import { LayoutGrid, MapPin, Package, X } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { formatQuantityVisitor, stockStatusTextVisitor } from '@/lib/stockHelpers';

type Props = {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
};

export default function ProductDetailModal({ open, item, onClose }: Props) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, handleClose]);

  if (!open || !item) return null;

  const status = stockStatusTextVisitor(item);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default bg-transparent"
        aria-label="Kapat"
        onClick={handleClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 sm:px-5">
          <h2
            id="product-detail-title"
            className="min-w-0 flex-1 truncate pr-2 text-xl font-bold text-zinc-900 sm:text-2xl dark:text-slate-50"
          >
            {item.productName}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-slate-600 dark:bg-slate-800/80">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="mx-auto max-h-[min(50vh,320px)] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[4/3] max-h-64 w-full items-center justify-center text-base text-zinc-400 dark:text-slate-500">
                Görsel yok
              </div>
            )}
          </div>

          <dl className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-slate-600">
              <dt className="flex items-center gap-2 text-base font-medium text-zinc-500 dark:text-slate-400">
                <MapPin className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                Raf
              </dt>
              <dd className="text-right text-lg font-bold text-zinc-900 dark:text-slate-100">
                #{item.shelfId}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-slate-600">
              <dt className="flex items-center gap-2 text-base font-medium text-zinc-500 dark:text-slate-400">
                <LayoutGrid className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
                Kategori
              </dt>
              <dd className="max-w-[65%] text-right text-base font-semibold text-violet-800 dark:text-violet-200">
                {item.category?.trim() ? item.category : 'Belirtilmedi'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-slate-600">
              <dt className="flex items-center gap-2 text-base font-medium text-zinc-500 dark:text-slate-400">
                <Package className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                Miktar
              </dt>
              <dd
                className={
                  status === 'Belirtilmedi'
                    ? 'text-right text-xl font-semibold text-zinc-500 dark:text-zinc-400'
                    : 'text-right text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400'
                }
              >
                {formatQuantityVisitor(item)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-base font-medium text-zinc-500 dark:text-slate-400">Durum</dt>
              <dd className="text-right text-lg font-semibold text-zinc-900 dark:text-slate-100">
                {status}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
