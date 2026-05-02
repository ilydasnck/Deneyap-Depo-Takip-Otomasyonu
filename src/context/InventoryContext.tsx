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
import type { WarehouseJsonShelf } from '@/types/warehouseJson';
import { getInventoryRepository } from '@/services/inventory';
import {
  enrichMissingImagesFromCatalog,
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
const INITIAL_REMOTE_TIMEOUT_MS = 6000;
const LOAD_TIMEOUT_MSG = 'Depo verisi yanıt vermiyor. Geçici olarak katalog verisi gösteriliyor.';
const SAVE_TIMEOUT_MSG = 'Depo verisi kaydedilemedi. Ürünler yine de görüntüleniyor.';

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouseShelves, setWarehouseShelves] = useState<
    WarehouseJsonShelf[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const repo = useMemo(() => getInventoryRepository(), []);
  const itemsRef = useRef<InventoryItem[]>([]);
  itemsRef.current = items;
  const saveChainRef = useRef(Promise.resolve<void>(undefined));

  const itemsForDisplay = useMemo(() => {
    if (!warehouseShelves?.length) return items;
    return enrichMissingImagesFromCatalog(items, warehouseShelves);
  }, [items, warehouseShelves]);

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
        if (!cancelled) {
          setWarehouseShelves(json);
          const seeded = seedInventoryFromWarehouseJson(json);
          setItems(seeded);
          setLoading(false);
        }

        const saved = await withTimeout(
          repo.loadItems(),
          INITIAL_REMOTE_TIMEOUT_MS,
          LOAD_TIMEOUT_MSG,
        ).catch((e: unknown) => {
          if (!cancelled && e instanceof Error && e.message !== LOAD_TIMEOUT_MSG) {
            setSyncError(e.message);
          }
          return null;
        });
        if (cancelled) return;

        const next =
          saved !== null && saved.length > 0
            ? mergeWarehouseJsonIntoItems(saved, json)
            : seedInventoryFromWarehouseJson(json);
        setItems(next);

        withTimeout(
          repo.saveItems(next),
          INITIAL_REMOTE_TIMEOUT_MS,
          SAVE_TIMEOUT_MSG,
        )
          .then(() => {
            if (!cancelled) setSyncError(null);
          })
          .catch((e: unknown) => {
            if (
              !cancelled &&
              e instanceof Error &&
              e.message !== SAVE_TIMEOUT_MSG
            ) {
              setSyncError(e.message);
            }
          });
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
      items: itemsForDisplay,
      loading,
      error,
      syncError,
      clearSyncError,
      addItem,
      updateItem,
      deleteItem,
    }),
    [
      itemsForDisplay,
      loading,
      error,
      syncError,
      clearSyncError,
      addItem,
      updateItem,
      deleteItem,
    ],
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
