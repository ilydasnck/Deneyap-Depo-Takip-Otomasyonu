import { AlertTriangle, CloudOff, X } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useFirebaseInventory } from '@/services/inventory';

function getFirebaseDebugInfo() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const missingVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ].filter((key) => {
    const value = import.meta.env[key as keyof ImportMetaEnv];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  return {
    projectId: typeof projectId === 'string' && projectId.trim() ? projectId : '(boş)',
    missingVars,
  };
}

/** Yerel depolama / Firebase durumu ve kayıt hataları için bilgi şeridi */
export default function DataSyncNotice() {
  const { syncError, clearSyncError } = useInventory();
  const firebase = useFirebaseInventory();
  const debug = getFirebaseDebugInfo();

  if (syncError) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-700/80 dark:bg-red-950/50 dark:text-red-100"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 text-sm leading-relaxed">
          <p className="font-semibold">Kayıt hatası</p>
          <p className="mt-1 opacity-95">{syncError}</p>
          <p className="mt-2 text-xs opacity-90">
            Firebase kullanıyorsanız Firestore kurallarında <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/80">inventory_items</code> için okuma/yazma iznini ve barındırma ortamındaki{' '}
            <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/80">VITE_*</code> değişkenlerini kontrol edin.
          </p>
          <p className="mt-2 text-xs opacity-90">
            Debug: mode=<code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/80">{firebase ? 'firebase' : 'local'}</code>, projectId=
            <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/80">{debug.projectId}</code>, eksik değişken=
            <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/80">
              {debug.missingVars.length > 0 ? debug.missingVars.join(', ') : 'yok'}
            </code>
          </p>
        </div>
        <button
          type="button"
          onClick={clearSyncError}
          className="shrink-0 rounded-lg p-1 text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900/60"
          aria-label="Uyarıyı kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  if (!firebase) {
    return (
      <div
        role="status"
        className="mb-4 flex flex-wrap items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-600/80 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <CloudOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 text-sm leading-relaxed">
          <p className="font-semibold">Veriler yalnızca bu cihazda</p>
          <p className="mt-1 opacity-95">
            Şu an stok ve yeni eklenen ürünler tarayıcınızda (yerel) saklanıyor;{' '}
            <strong>başka telefon veya bilgisayarlarda görünmez.</strong> Tüm cihazlarda ortak liste için
            canlı sitede <code className="rounded bg-amber-100/90 px-1 py-0.5 text-amber-950 dark:bg-amber-900/80 dark:text-amber-50">VITE_USE_FIREBASE=true</code> ve Firebase
            web uygulama anahtarlarını barındırma paneline ekleyip projeyi yeniden derleyin; Firestore’da{' '}
            <code className="rounded bg-amber-100/90 px-1 py-0.5 dark:bg-amber-950 dark:text-amber-50">inventory_items</code> koleksiyonu kullanılır.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
