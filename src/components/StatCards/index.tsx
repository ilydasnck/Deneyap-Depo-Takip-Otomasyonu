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

export default function StatCards({ items }: Props) {
  const used = countShelvesInUse(items);
  const low = countLowStockItems(items);

  const cards = [
    { label: 'Kullanılan Raf', value: used },
    { label: 'Kayıtlı Ürün', value: items.length },
    { label: 'Düşük Stok', value: low },
  ];

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900/70"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-slate-400">{c.label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
