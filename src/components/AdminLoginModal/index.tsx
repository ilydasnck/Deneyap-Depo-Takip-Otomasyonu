import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { getAdminPassword } from '@/services/inventory/adminSession';

type Props = {
  open: boolean;
  onSuccess: () => void;
};

export default function AdminLoginModal({ open, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setErr(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === getAdminPassword()) {
      onSuccess();
      setPassword('');
      setErr(null);
    } else {
      setErr('Şifre hatalı.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center gap-2 text-[#B71C1C]">
          <Lock className="h-6 w-6" aria-hidden />
          <h2 id="admin-login-title" className="text-xl font-bold">
            Yönetici Girişi
          </h2>
        </div>
        <p className="mb-4 text-base text-zinc-600 dark:text-slate-400">
          Devam etmek için yönetici şifresini girin.
        </p>
        <label className="block text-sm font-medium text-zinc-600 dark:text-slate-400">
          Şifre
          <input
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? 'admin-login-err' : undefined}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none ring-red-500/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        {err ? (
          <p id="admin-login-err" className="mt-2 text-base text-red-600" role="alert">
            {err}
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#B71C1C] to-[#D32F2F] py-2.5 text-base font-semibold text-white shadow-md transition hover:brightness-110"
        >
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
