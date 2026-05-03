import {
  collection,
  deleteDoc,
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
  if (img.startsWith('data:')) return null;
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
  };
  const persisted = persistableImageUrl(it.imageUrl);
  if (persisted !== null) {
    out.imageUrl = persisted;
  } else if (it.imageUrl === '') {
    /** Yönetici panelinde görsel alanı bilinçle temizlendi */
    out.imageUrl = null;
  }
  /** `undefined` veya `data:` / çok uzun metin: alan gönderilmez — konsoldan eklenen URL veya
   *  eski https değeri `merge` ile korunur (istemci o an görsel taşımıyorsa üzerine yazılmaz). */
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export class FirebaseInventoryRepository implements InventoryRepository {
  async loadItems(): Promise<InventoryItem[] | null> {
    const fs = getFirestoreDb();
    const snap = await getDocs(collection(fs, COLLECTION));
    if (snap.empty) return [];
    return snap.docs.map((d) =>
      fromFirestore(d.id, d.data() as Record<string, unknown>),
    );
  }

  async saveItems(items: InventoryItem[]): Promise<void> {
    const fs = getFirestoreDb();
    const colRef = collection(fs, COLLECTION);
    const snap = await getDocs(colRef);
    const wantIds = new Set(items.map((i) => i.id));

    for (const d of snap.docs) {
      if (!wantIds.has(d.id)) {
        await deleteDoc(doc(fs, COLLECTION, d.id));
      }
    }

    const parts = chunk(items, 400);
    for (const part of parts) {
      const batch = writeBatch(fs);
      for (const it of part) {
        const ref = doc(fs, COLLECTION, it.id);
        batch.set(ref, toFirestoreFields(it), { merge: true });
      }
      await batch.commit();
    }
  }
}

let singleton: FirebaseInventoryRepository | null = null;

export function getFirebaseInventoryRepository(): InventoryRepository {
  if (!singleton) singleton = new FirebaseInventoryRepository();
  return singleton;
}
