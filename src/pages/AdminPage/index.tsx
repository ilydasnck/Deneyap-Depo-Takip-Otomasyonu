import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import Layout from '@/components/Layout';
import AdminLoginModal from '@/components/AdminLoginModal';
import StatCards from '@/components/StatCards';
import ShelfTable from '@/components/ShelfTable';
import ProductFormModal from '@/components/ProductFormModal';
import { useInventory } from '@/context/InventoryContext';
import {
  isAdminSessionActive,
  setAdminSessionActive,
} from '@/services/inventory/adminSession';
import type { InventoryItem } from '@/types/inventory';

export default function AdminPage() {
  const navigate = useNavigate();
  const { items, loading, error, addItem, updateItem, deleteItem } = useInventory();
  const [authed, setAuthed] = useState(() => isAdminSessionActive());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formShelf, setFormShelf] = useState(1);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const onLoginSuccess = () => {
    setAdminSessionActive(true);
    setAuthed(true);
  };

  const logout = () => {
    setAdminSessionActive(false);
    setAuthed(false);
    navigate('/');
  };

  const openAdd = (shelfId: number) => {
    setFormMode('add');
    setFormShelf(shelfId);
    setEditing(null);
    setFormOpen(true);
  };

  const openAddHeader = () => {
    setFormMode('add');
    setFormShelf(1);
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setFormMode('edit');
    setEditing(item);
    setFormOpen(true);
  };

  const onDelete = (item: InventoryItem) => {
    if (window.confirm(`"${item.productName}" silinsin mi?`)) deleteItem(item.id);
  };

  const onSaveForm = (payload: {
    shelfId: number;
    productName: string;
    quantity: number;
    category?: string;
    imageUrl?: string;
  }) => {
    if (formMode === 'add') {
      addItem(payload);
    } else if (editing) {
      updateItem(editing.id, {
        shelfId: payload.shelfId,
        productName: payload.productName,
        quantity: payload.quantity,
        category: payload.category,
        imageUrl: payload.imageUrl,
      });
    }
    setFormOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <Layout variant="admin" header={<AppHeader variant="admin" subtitle="Yönetici Paneli" />}>
        <p className="text-center text-lg text-zinc-600 dark:text-slate-300">Yükleniyor…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout variant="admin" header={<AppHeader variant="admin" subtitle="Yönetici Paneli" />}>
        <p className="text-center text-lg text-red-600 dark:text-red-300">{error}</p>
      </Layout>
    );
  }

  const adminHeader = (
    <AppHeader
      variant="admin"
      subtitle="Yönetici Paneli"
      extraActions={
        authed ? (
          <>
            <button
              type="button"
              onClick={openAddHeader}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:brightness-110"
            >
              <Plus className="h-5 w-5" aria-hidden />
              Yeni Malzeme Ekle
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-base font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Çıkış
            </button>
          </>
        ) : null
      }
    />
  );

  return (
    <Layout variant="admin" header={adminHeader}>
      <AdminLoginModal open={!authed} onSuccess={onLoginSuccess} />

      <div className={authed ? 'space-y-8' : 'pointer-events-none blur-sm'}>
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/90 to-blue-50/40 p-6 shadow-lg ring-1 ring-zinc-100/80 dark:border-slate-600 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 dark:ring-slate-700/60 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#1976D2]/10 blur-3xl dark:bg-blue-500/15" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-[#B71C1C]/8 blur-2xl dark:bg-red-500/10" />
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Depo yönetimi
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-slate-400">
            84 raf üzerinden ürün ekleyin, stok adetlerini güncelleyin ve katalogu güncel tutun.
            Özet kartları takip ederek sayımı tamamlanmamış ürünleri hızlıca görebilirsiniz.
          </p>
        </section>

        <StatCards items={items} />

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-slate-100">
            <Layers className="h-5 w-5 text-[#1976D2] dark:text-blue-400" aria-hidden />
            Raf ve ürünler
          </h3>
          <ShelfTable items={items} onAdd={openAdd} onEdit={openEdit} onDelete={onDelete} />
        </section>
      </div>

      <ProductFormModal
        open={formOpen && authed}
        mode={formMode}
        initialShelfId={formShelf}
        item={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={onSaveForm}
      />
    </Layout>
  );
}
