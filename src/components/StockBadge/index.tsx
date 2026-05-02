import { formatQuantityTr, getStockLevel, stockBadgeClass } from '@/lib/stockHelpers';

type Props = { quantity: number };

export default function StockBadge({ quantity }: Props) {
  const level = getStockLevel(quantity);
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${stockBadgeClass(level)}`}
    >
      {formatQuantityTr(quantity)}
    </span>
  );
}
