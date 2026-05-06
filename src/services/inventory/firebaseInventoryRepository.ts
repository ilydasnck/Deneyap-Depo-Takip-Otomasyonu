import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { InventoryItem } from '@/types/inventory';
import { getFirestoreDb } from '@/services/firebase/config';
import type { InventoryRepository } from '@/services/inventory/repository';

const COLLECTION = 'inventory_items';

/**
 * Firestore belge boyutu üst sınırı (~1 MiB); devasa `data:` base64 ve aşırı uzun string’ler yazılmaz.
 * Kalıcı görüntü için `https://...` (tercihen kendi sunucunuz veya Firebase Storage) kullanın;
 * imzalı / süreli paylaşım linkleri süresi dolunca tarayıcıda “kaybolmuş” gibi görünür.
 */
function persistableImageUrl(url: string | undefined): string | null {
  const img = url?.trim();
  if (!img) return null;
  if (!/^https?:\/\//i.test(img)) return null;
  if (img.length > 400_000) return null;
  return img;
}

function toFirestoreFields(it: InventoryItem): Record<string, unknown> {
  const out: Record<string, unknown> = {
    shelfId: it.shelfId,
    productName: it.productName,
    quantity: it.quantity,
    quantityRecorded: it.quantityRecorded === true,
    category: it.category?.trim() ?? null,
    /** Her belgede imageUrl alanı olsun; geçerli URL yoksa null. */
    imageUrl: persistableImageUrl(it.imageUrl) ?? null,
  };
  return out;
}

function fromFirestore(id: string, data: Record<string, unknown>): InventoryItem {
  const imageUrl =
    typeof data.imageUrl === 'string' && data.imageUrl.trim()
      ? data.imageUrl.trim()
      : undefined;
  return {
    id,
    shelfId: Number(data.shelfId),
    productName: String(data.productName ?? ''),
    quantity: Math.max(0, Math.floor(Number(data.quantity ?? 0))),
    quantityRecorded: data.quantityRecorded === true,
    category:
      typeof data.category === 'string' && data.category.trim()
        ? data.category.trim()
        : undefined,
    imageUrl,
  };
}

function dedupeKey(it: InventoryItem): string {
  const name = it.productName.trim().toLocaleLowerCase('tr');
  return `${it.shelfId}::${name}`;
}

function choosePreferred(a: InventoryItem, b: InventoryItem): InventoryItem {
  const score = (x: InventoryItem): number =>
    (x.quantityRecorded ? 4 : 0) +
    (x.quantity > 0 ? 2 : 0) +
    (x.imageUrl?.trim() ? 1 : 0);
  return score(b) > score(a) ? b : a;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export class FirebaseInventoryRepository implements InventoryRepository {
  private lastSavedFieldsById = new Map<string, string>();

  private serializeFields(it: InventoryItem): string {
    return JSON.stringify(toFirestoreFields(it));
  }

  async loadItems(): Promise<InventoryItem[] | null> {
    const fs = getFirestoreDb();
    const snap = await getDocs(collection(fs, COLLECTION));
    if (snap.empty) return [];
    const all = snap.docs.map((d) =>
      fromFirestore(d.id, d.data() as Record<string, unknown>),
    );
    /**
     * Aynı ürün Firestore'a farklı belge ID'leriyle birden fazla yazılmış olabilir.
     * Ekranda tek satır göstermek için raf+ürün adına göre tekilleştir.
     */
    const byKey = new Map<string, InventoryItem>();
    for (const it of all) {
      const key = dedupeKey(it);
      const prev = byKey.get(key);
      byKey.set(key, prev ? choosePreferred(prev, it) : it);
    }
    const deduped = [...byKey.values()].sort(
      (a, b) =>
        a.shelfId - b.shelfId ||
        a.productName.localeCompare(b.productName, 'tr', { sensitivity: 'base' }),
    );
    /** İlk yüklemede anlık local snapshot alınır; sonraki kayıtlarda sadece değişen belgeler yazılır. */
    this.lastSavedFieldsById = new Map(
      deduped.map((it) => [it.id, this.serializeFields(it)]),
    );
    return deduped;
  }

  async saveItems(items: InventoryItem[]): Promise<void> {
    const fs = getFirestoreDb();
    const nextById = new Map<string, string>();
    const changed: InventoryItem[] = [];
    for (const it of items) {
      const serialized = this.serializeFields(it);
      nextById.set(it.id, serialized);
      if (this.lastSavedFieldsById.get(it.id) !== serialized) changed.push(it);
    }

    const removedIds: string[] = [];
    for (const prevId of this.lastSavedFieldsById.keys()) {
      if (!nextById.has(prevId)) removedIds.push(prevId);
    }

    const removedParts = chunk(removedIds, 400);
    for (const part of removedParts) {
      const batch = writeBatch(fs);
      for (const it of part) {
        batch.delete(doc(fs, COLLECTION, it));
      }
      await batch.commit();
    }

    const changedParts = chunk(changed, 400);
    for (const part of changedParts) {
      const batch = writeBatch(fs);
      for (const it of part) {
        batch.set(doc(fs, COLLECTION, it.id), toFirestoreFields(it), { merge: true });
      }
      await batch.commit();
    }

    this.lastSavedFieldsById = nextById;
    if (import.meta.env.DEV) {
      console.info(
        `[inventory] Firestore senkron: +${changed.length} güncelleme, -${removedIds.length} silme (${COLLECTION})`,
      );
    }
  }
}

let singleton: FirebaseInventoryRepository | null = null;

export function getFirebaseInventoryRepository(): InventoryRepository {
  if (!singleton) singleton = new FirebaseInventoryRepository();
  return singleton;
}
