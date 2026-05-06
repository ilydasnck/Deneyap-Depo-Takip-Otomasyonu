import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const JSON_PATH = join(ROOT, 'urunler.json');
const COLLECTION = 'inventory_items';
const BATCH_SIZE = 200;

function loadDotEnv() {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return;
  const text = readFileSync(p, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

function stableDocId(shelfId, productName) {
  const key = `${shelfId}\0${productName.trim().normalize('NFKC')}`;
  return `json_${createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 32)}`;
}

function toImageUrl(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return null;
  if (t.length > 400_000) return null;
  return t;
}

function parseItems(json) {
  if (!Array.isArray(json)) throw new Error('urunler.json dizi olmalı');
  const out = [];
  for (const shelf of json) {
    const shelfId = Math.min(84, Math.max(1, Math.floor(Number(shelf?.raf_no) || 1)));
    const category = typeof shelf?.kategori === 'string' && shelf.kategori.trim()
      ? shelf.kategori.trim()
      : null;
    for (const p of Array.isArray(shelf?.urunler) ? shelf.urunler : []) {
      const name = String(p?.ad ?? '').trim();
      if (!name) continue;
      out.push({
        id: stableDocId(shelfId, name),
        shelfId,
        productName: name,
        quantity: 0,
        quantityRecorded: false,
        category,
        imageUrl: toImageUrl(p?.fotograf),
      });
    }
  }
  return out;
}

async function main() {
  if (!existsSync(JSON_PATH)) {
    throw new Error('urunler.json bulunamadı');
  }
  loadDotEnv();
  const cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) {
    throw new Error('Firebase env eksik');
  }
  const json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const items = parseItems(json);
  const db = getFirestore(initializeApp(cfg));
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const it of items.slice(i, i + BATCH_SIZE)) {
      batch.set(doc(db, COLLECTION, it.id), {
        shelfId: it.shelfId,
        productName: it.productName,
        quantity: it.quantity,
        quantityRecorded: it.quantityRecorded,
        category: it.category,
        imageUrl: it.imageUrl,
      }, { merge: true });
    }
    await batch.commit();
  }
  console.log(`Restore tamam: ${items.length} ürün Firestore'a yazıldı.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

