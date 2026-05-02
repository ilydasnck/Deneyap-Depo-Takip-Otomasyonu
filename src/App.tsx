import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

const AdminPage = lazy(() => import('@/pages/AdminPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/admin"
        element={(
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl p-6 text-center text-zinc-600 dark:text-slate-300">
                Yönetici ekranı yükleniyor...
              </div>
            }
          >
            <AdminPage />
          </Suspense>
        )}
      />
    </Routes>
  );
}
