import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { InventoryItem } from '@/types/inventory';
import { getInventoryRepository } from '@/services/inventory';
import {
  fetchWarehouseJson,
  mergeWarehouseJsonIntoItems,
  seedInventoryFromWarehouseJson,
} from '@/services/inventory/seedFromJson';

type AddInput = {
  shelfId: number;
  productName: string;
  quantity: number;
  category?: string;
  imageUrl?: string;
};

type InventoryContextValue = {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  addItem: (input: AddInput) => void;
  updateItem: (
    id: string,
    patch: Partial<
      Pick<
        InventoryItem,
        | 'productName'
        | 'quantity'
        | 'imageUrl'
        | 'shelfId'
        | 'quantityRecorded'
        | 'category'
      >
    >,
  ) => void;
  deleteItem: (id: string) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const repo = useMemo(() => getInventoryRepository(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await fetchWarehouseJson();
        const saved = repo.loadItems();
        const next =
          saved !== null && saved.length > 0
            ? mergeWarehouseJsonIntoItems(saved, json)
            : seedInventoryFromWarehouseJson(json);
        if (!cancelled) {
          setItems(next);
          repo.saveItems(next);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Veri yüklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => {
    if (loading || error) return;
    repo.saveItems(items);
  }, [items, loading, error, repo]);

  const addItem = useCallback((input: AddInput) => {
    const id = crypto.randomUUID();
    setItems((prev) => [
      ...prev,
      {
        id,
        shelfId: input.shelfId,
        productName: input.productName.trim(),
        quantity: Math.max(0, Math.floor(input.quantity)),
        quantityRecorded: true,
        category: input.category?.trim() || undefined,
        imageUrl: input.imageUrl?.trim() || undefined,
      },
    ]);
  }, []);

  const updateItem = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          InventoryItem,
          'productName' | 'quantity' | 'imageUrl' | 'shelfId'           | 'quantityRecorded'
          | 'category'
        >
      >,
    ) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const next = { ...it, ...patch };
          if (typeof next.quantity === 'number') {
            next.quantity = Math.max(0, Math.floor(next.quantity));
            next.quantityRecorded = true;
          }
          if (typeof next.productName === 'string')
            next.productName = next.productName.trim();
          if (next.imageUrl !== undefined)
            next.imageUrl = next.imageUrl?.trim() || undefined;
          if (typeof next.shelfId === 'number')
            next.shelfId = Math.min(84, Math.max(1, Math.floor(next.shelfId)));
          if (next.category !== undefined)
            next.category = next.category?.trim() || undefined;
          return next;
        }),
      );
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const value = useMemo(
    () => ({ items, loading, error, addItem, updateItem, deleteItem }),
    [items, loading, error, addItem, updateItem, deleteItem],
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory InventoryProvider dışında kullanılamaz');
  return ctx;
}
