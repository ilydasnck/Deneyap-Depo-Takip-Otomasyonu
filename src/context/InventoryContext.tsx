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

type AddInput = {
  shelfId: number;
  productName: string;
  quantity: number;
  category?: string;
  imageUrl?: string;
};

type InventoryContextValue = {
  items: InventoryItem[];
  /** İlk `loadItems` bitene kadar true */
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

const INITIAL_REMOTE_TIMEOUT_MS = 30000;
const LOAD_TIMEOUT_MSG = 'Depo verisi yanıt vermiyor. Ağ veya Firebase yapılandırmasını kontrol edin.';
const SAVE_DEBOUNCE_MS = 700;
const CACHE_KEY = 'inventory_cache_v1';
const CACHE_TTL_MS = 2 * 60 * 1000;

function formatPersistenceError(e: unknown): string {
  if (e instanceof Error) {
    const code = (e as { code?: string }).code;
    const head = code ? `${code}: ${e.message}` : e.message;
    if (code === 'permission-denied') {
      return `${head} — Firebase Console’da Firestore → Kurallar (Rules): inventory_items için okuma/yazma açık kuralları yapıştırıp «Yayınla» (Publish) edin; veya proje klasöründe «firebase deploy --only firestore:rules» çalıştırın.`;
    }
    return head;
  }
  return 'Veriler kaydedilemedi. Ağ veya sunucu izinlerini kontrol edin.';
}

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

async function loadWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  timeoutMs: number,
  timeoutMsg: string,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await withTimeout(fn(), timeoutMs, timeoutMsg);
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw lastErr;
}

function readCache(): InventoryItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; items?: InventoryItem[] };
    if (!Array.isArray(parsed.items) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items: InventoryItem[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch {
    // cache best-effort
  }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState(() => readCache() === null);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  /**
   * Yalnızca `loadItems` başarıyla bittiğinde true. Zaman aşımı / ağ hatasında false kalır;
   * bu durumda kayıt yapılmaz (aksi halde kısmi bellek listesiyle tüm Firestore silinebilirdi).
   */
  const persistOkRef = useRef(false);
  /** Her render’da güncel repo; `useMemo([], [])` eski LocalStorage referansını tutup .env sonrası Firestore’a geçmeyi engelleyebilir. */
  const repo = getInventoryRepository();
  const itemsRef = useRef<InventoryItem[]>([]);
  itemsRef.current = items;
  const saveChainRef = useRef(Promise.resolve<void>(undefined));
  const saveTimerRef = useRef<number | null>(null);

  const persistSnapshot = useCallback(
    async (snapshot: InventoryItem[]) => {
      await repo.saveItems(snapshot);
    },
    [repo],
  );

  const clearSyncError = useCallback(() => setSyncError(null), []);

  /** Ardışık kayıtları sıraya alır; eşzamanlı yazışmalarda eski listenin üzerine yazılmasını önler. */
  const enqueueSave = useCallback(
    (snapshot: InventoryItem[]) => {
      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(() => persistSnapshot(snapshot))
        .then(() => setSyncError(null))
        .catch((e: unknown) => setSyncError(formatPersistenceError(e)));
    },
    [persistSnapshot],
  );

  const scheduleSave = useCallback(
    (snapshot: InventoryItem[]) => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        enqueueSave(snapshot);
      }, SAVE_DEBOUNCE_MS);
    },
    [enqueueSave],
  );

  useEffect(() => {
    let cancelled = false;
    persistOkRef.current = false;
    (async () => {
      try {
        const cache = readCache();
        if (cache && !cancelled) {
          setItems(cache);
          setLoading(false);
          // Cache hızlı açılış için; asıl kaynak yine Firestore.
          // Bu yüzden erken dönmeyip arka planda uzak veriyi de çekiyoruz.
        }

        const raw = await loadWithRetry(
          () => repo.loadItems(),
          1,
          INITIAL_REMOTE_TIMEOUT_MS,
          LOAD_TIMEOUT_MSG,
        ).catch((e: unknown) => {
          if (!cancelled) setSyncError(formatPersistenceError(e));
          return null;
        });
        if (cancelled) return;

        const loadFailed = raw === null;
        const list = raw ?? [];

        if (!cancelled && !loadFailed) setItems(list);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Veri yüklenemedi');
      } finally {
        if (!cancelled) {
          /** İlk okuma hatalı olsa da sonradan yapılan düzenlemeler Firestore'a yazılabilsin. */
          persistOkRef.current = true;
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => {
    writeCache(items);
  }, [items]);

  useEffect(() => {
    if (loading || error) return;
    const flush = () => {
      if (document.visibilityState !== 'hidden') return;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      queueMicrotask(() => enqueueSave(itemsRef.current));
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [loading, error, enqueueSave]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    },
    [],
  );

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
      queueMicrotask(() => scheduleSave(next));
      return next;
    });
  }, [scheduleSave]);

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
          if (row.imageUrl !== undefined) {
            const trimmed = String(row.imageUrl).trim();
            row.imageUrl = trimmed.length > 0 ? trimmed : '';
          }
          if (typeof row.shelfId === 'number')
            row.shelfId = Math.min(84, Math.max(1, Math.floor(row.shelfId)));
          if (row.category !== undefined)
            row.category = row.category?.trim() || undefined;
          return row;
        });
        queueMicrotask(() => scheduleSave(next));
        return next;
      });
    },
    [scheduleSave],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        queueMicrotask(() => scheduleSave(next));
        return next;
      });
    },
    [scheduleSave],
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
    [
      items,
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
