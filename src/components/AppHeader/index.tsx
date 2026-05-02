import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

type Props = {
  variant?: 'home' | 'admin';
  subtitle?: string;
  extraActions?: ReactNode;
};

export default function AppHeader({ variant = 'home', subtitle, extraActions }: Props) {
  return (
    <header className="sticky top-0 z-50 mb-6 w-full min-w-0 border-b border-zinc-200 bg-white dark:border-slate-700 dark:bg-[#0f172a]">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-3.5 lg:max-w-7xl xl:px-8 2xl:max-w-[min(100%,92rem)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {/* Sol: geri (admin) + logo + başlık */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
            {variant === 'admin' ? (
              <Link
                to="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 transition hover:bg-zinc-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Ana sayfaya dön"
              >
                <span aria-hidden className="text-lg leading-none">
                  ←
                </span>
              </Link>
            ) : null}

            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <div className="flex shrink-0 items-center">
                <img
                  src="/logo.png"
                  alt="Deneyap Türkiye"
                  width={400}
                  height={112}
                  loading="eager"
                  decoding="async"
                  className="h-16 w-auto object-contain object-center sm:h-28 md:h-32"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-bold leading-tight tracking-tight text-[#0b1220] dark:text-white text-xl sm:text-2xl md:text-3xl">
                  Depo Takip Sistemi
                </h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-sm font-medium text-zinc-600 dark:text-slate-400 sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sağ: tema + yönetici (+ admin ekstra) */}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:justify-end sm:gap-3">
            <ThemeToggle />
            {variant === 'home' ? (
              <Link
                to="/admin"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#B71C1C] px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:bg-[#9a1818] active:bg-[#851414] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B71C1C] sm:flex-initial sm:min-w-0 sm:px-6"
              >
                <Settings2 className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
                <span className="whitespace-nowrap">Yönetici Girişi</span>
              </Link>
            ) : null}
            {extraActions}
          </div>
        </div>
      </div>
    </header>
  );
}
