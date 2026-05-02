import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
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
  const [filter, setFilter] = useState('');
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
    imageUrl?: string;
  }) => {
    if (formMode === 'add') {
      addItem(payload);
    } else if (editing) {
      updateItem(editing.id, {
        shelfId: payload.shelfId,
        productName: payload.productName,
        quantity: payload.quantity,
        imageUrl: payload.imageUrl,
      });
    }
    setFormOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <Layout variant="admin" header={<AppHeader variant="admin" subtitle="Yönetici Paneli" />}>
        <p className="text-center text-zinc-600 dark:text-slate-300">Yükleniyor…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout variant="admin" header={<AppHeader variant="admin" subtitle="Yönetici Paneli" />}>
        <p className="text-center text-red-600 dark:text-red-300">{error}</p>
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
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Yeni Malzeme Ekle
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
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

      <div className={authed ? '' : 'pointer-events-none blur-sm'}>
        <div className="relative rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-sm dark:border-slate-600 dark:bg-slate-900/70 sm:p-4">
          <Search
            className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Ürün adı veya raf numarasına göre filtrele..."
            aria-label="Yönetici filtresi"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-3 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        <ShelfTable
          items={items}
          filter={filter}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={onDelete}
        />

        <StatCards items={items} />
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
