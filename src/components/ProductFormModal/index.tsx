import { useEffect, useRef, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { SHELF_COUNT } from '@/types/inventory';

type Mode = 'add' | 'edit';

type Props = {
  open: boolean;
  mode: Mode;
  initialShelfId?: number;
  item?: InventoryItem | null;
  onClose: () => void;
  onSave: (payload: {
    shelfId: number;
    productName: string;
    quantity: number;
    category?: string;
    imageUrl?: string;
  }) => void;
};

export default function ProductFormModal({
  open,
  mode,
  initialShelfId = 1,
  item,
  onClose,
  onSave,
}: Props) {
  const [shelfId, setShelfId] = useState(initialShelfId);
  const [name, setName] = useState('');
  const [qty, setQty] = useState(0);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && item) {
      setShelfId(item.shelfId);
      setName(item.productName);
      setQty(item.quantity);
      setUrl(item.imageUrl ?? '');
      setCategory(item.category ?? '');
    } else {
      setShelfId(initialShelfId);
      setName('');
      setQty(0);
      setUrl('');
      setCategory('');
    }
    const t = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, mode, item, initialShelfId]);

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

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      shelfId,
      productName: name.trim(),
      quantity: Number.isFinite(qty) ? qty : 0,
      category: category.trim() || undefined,
      imageUrl: url.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="product-form-title" className="text-xl font-bold">
            {mode === 'add' ? 'Yeni Malzeme Ekle' : 'Ürünü Düzenle'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-base text-zinc-600 dark:text-slate-400">
          Aynı rafa birden fazla farklı ürün ekleyebilirsiniz.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Raf numarası
            <select
              value={shelfId}
              onChange={(e) => setShelfId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-800"
            >
              {Array.from({ length: SHELF_COUNT }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  #{n}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Ürün adı
            <input
              ref={nameRef}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Kategori (opsiyonel)
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Örn. Elektronik Ölçüm"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Adet (opsiyonel, varsayılan 0)
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
            Görsel URL (opsiyonel)
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          {url.trim() ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-600">
              <p className="bg-zinc-50 px-2 py-1 text-sm text-zinc-500 dark:bg-slate-800 dark:text-slate-400">
                Önizleme
              </p>
              <img src={url} alt="" className="max-h-40 w-full object-contain bg-white dark:bg-slate-900" />
            </div>
          ) : null}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-base font-semibold dark:border-slate-600"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] py-2.5 text-base font-semibold text-white shadow"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
