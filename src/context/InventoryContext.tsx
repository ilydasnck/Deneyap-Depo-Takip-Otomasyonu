import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** Firestore/local kayıt başarısız olduğunda dolabilir */
  syncError: string | null;
  clearSyncError: () => void;
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

const SAVE_DEBOUNCE_MS = 500;

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const repo = useMemo(() => getInventoryRepository(), []);
  const itemsRef = useRef<InventoryItem[]>([]);
  itemsRef.current = items;
  const saveChainRef = useRef(Promise.resolve<void>(undefined));

  const clearSyncError = useCallback(() => setSyncError(null), []);

  /** Ardışık kayıtları sıraya alır; eşzamanlı yazışmalarda eski listenin üzerine yazılmasını önler. */
  const enqueueSave = useCallback(
    (snapshot: InventoryItem[]) => {
      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(() => repo.saveItems(snapshot))
        .then(() => setSyncError(null))
        .catch((e: unknown) =>
          setSyncError(
            e instanceof Error
              ? e.message
              : 'Veriler kaydedilemedi. Ağ veya sunucu izinlerini kontrol edin.',
          ),
        );
    },
    [repo],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await fetchWarehouseJson();
        const saved = await repo.loadItems();
        const next =
          saved !== null && saved.length > 0
            ? mergeWarehouseJsonIntoItems(saved, json)
            : seedInventoryFromWarehouseJson(json);
        if (!cancelled) {
          setItems(next);
          try {
            await repo.saveItems(next);
            setSyncError(null);
          } catch (e) {
            setSyncError(
              e instanceof Error ? e.message : 'İlk kayıt yapılamadı.',
            );
          }
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
    const t = window.setTimeout(() => {
      enqueueSave(itemsRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [items, loading, error, enqueueSave]);

  useEffect(() => {
    if (loading || error) return;
    const flush = () => {
      if (document.visibilityState === 'hidden') enqueueSave(itemsRef.current);
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [loading, error, enqueueSave]);

  const addItem = useCallback((input: AddInput) => {
    const id = crypto.randomUUID();
    setItems((prev) => {
      const next = [
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
      ];
      enqueueSave(next);
      return next;
    });
  }, [enqueueSave]);

  const updateItem = useCallback(
    (
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
    ) => {
      setItems((prev) => {
        const next = prev.map((it) => {
          if (it.id !== id) return it;
          const row = { ...it, ...patch };
          if (typeof row.quantity === 'number') {
            row.quantity = Math.max(0, Math.floor(row.quantity));
            row.quantityRecorded = true;
          }
          if (typeof row.productName === 'string')
            row.productName = row.productName.trim();
          if (row.imageUrl !== undefined)
            row.imageUrl = row.imageUrl?.trim() || undefined;
          if (typeof row.shelfId === 'number')
            row.shelfId = Math.min(84, Math.max(1, Math.floor(row.shelfId)));
          if (row.category !== undefined)
            row.category = row.category?.trim() || undefined;
          return row;
        });
        enqueueSave(next);
        return next;
      });
    },
    [enqueueSave],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        enqueueSave(next);
        return next;
      });
    },
    [enqueueSave],
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      syncError,
      clearSyncError,
      addItem,
      updateItem,
      deleteItem,
    }),
    [items, loading, error, syncError, clearSyncError, addItem, updateItem, deleteItem],
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
