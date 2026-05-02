import type { InventoryItem } from '@/types/inventory';
import {
  formatQuantityTr,
  formatQuantityVisitor,
  getStockLevel,
  isVisitorStockUnspecified,
  stockBadgeClass,
  visitorUnspecifiedBadgeClass,
} from '@/lib/stockHelpers';

type Props = {
  item: InventoryItem;
};

export default function StockBadge({ item }: Props) {
  if (isVisitorStockUnspecified(item)) {
    return (
      <span
        className={`inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-base font-semibold ${visitorUnspecifiedBadgeClass()}`}
      >
        {formatQuantityVisitor(item)}
      </span>
    );
  }
  const level = getStockLevel(item.quantity);
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-base font-semibold ${stockBadgeClass(level)}`}
    >
      {formatQuantityTr(item.quantity)}
    </span>
  );
}
