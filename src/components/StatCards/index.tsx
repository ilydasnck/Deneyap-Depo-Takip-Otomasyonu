import type { InventoryItem } from '@/types/inventory';
import { countLowStockItems } from '@/lib/stockHelpers';

type Props = {
  items: InventoryItem[];
};

function countShelvesInUse(items: InventoryItem[]): number {
  const set = new Set<number>();
  for (const it of items) set.add(it.shelfId);
  return set.size;
}

function countAwaitingQuantity(items: InventoryItem[]): number {
  return items.filter((i) => i.quantityRecorded !== true).length;
}

export default function StatCards({ items }: Props) {
  const used = countShelvesInUse(items);
  const low = countLowStockItems(items);
  const awaiting = countAwaitingQuantity(items);

  const cards = [
    { label: 'Kullanılan Raf', value: used },
    { label: 'Kayıtlı Ürün', value: items.length },
    { label: 'Düşük Stok', value: low, hint: 'Sayımı yapılmış, 1–9 adet' },
    { label: 'Sayım Bekleyen', value: awaiting, hint: 'Adet henüz girilmemiş' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-zinc-100/80 dark:border-slate-600 dark:bg-slate-900/70 dark:ring-slate-700/50"
        >
          <p className="text-base font-medium text-zinc-500 dark:text-slate-400">{c.label}</p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {c.value}
          </p>
          {'hint' in c && c.hint ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-slate-500">{c.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
