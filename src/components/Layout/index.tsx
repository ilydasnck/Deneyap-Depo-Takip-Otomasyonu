import { Github } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  variant?: 'home' | 'admin';
  /** Viewport genişliğinde üst şerit (header); içerik sütununun dışında render edilir */
  header?: ReactNode;
};

export default function Layout({ children, variant = 'home', header }: Props) {
  return (
    <div
      className={
        variant === 'home'
          ? 'relative flex min-h-dvh flex-col overflow-x-clip bg-white text-zinc-900 dark:bg-gradient-to-br dark:from-[#0D1B2A] dark:to-[#1B263B] dark:text-slate-100'
          : 'relative flex min-h-dvh flex-col overflow-x-clip bg-zinc-50 text-zinc-900 dark:bg-gradient-to-br dark:from-[#0D1B2A] dark:to-[#1B263B] dark:text-slate-100'
      }
    >
      {variant === 'home' ? (
        <>
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/10"
            aria-hidden
          />
        </>
      ) : null}

      {header != null ? (
        <div className="relative z-10 w-full min-w-0">{header}</div>
      ) : null}

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-8 pt-6 text-base leading-relaxed sm:px-6 md:text-lg lg:max-w-7xl xl:px-8 2xl:max-w-[min(100%,92rem)]">
        {children}
      </div>

      <footer className="relative z-10 border-t border-zinc-200/80 px-4 py-3 text-center text-sm text-zinc-600 dark:border-slate-700/70 dark:text-slate-300 sm:px-6">
        <p>© Copyright 2026. Tüm Hakları Saklıdır.</p>
        <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a
            href="https://github.com/ilydasnck"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 underline decoration-zinc-400/70 underline-offset-4 hover:text-zinc-900 dark:hover:text-white"
          >
            <Github className="h-4 w-4" aria-hidden />
            İlayda ŞENOCAK
          </a>
          <a
            href="https://github.com/ezgigozutok"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 underline decoration-zinc-400/70 underline-offset-4 hover:text-zinc-900 dark:hover:text-white"
          >
            <Github className="h-4 w-4" aria-hidden />
            Ezgi GÖZÜTOK
          </a>
        </p>
      </footer>
    </div>
  );
}
