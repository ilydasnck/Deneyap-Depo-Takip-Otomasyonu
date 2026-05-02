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
          ? 'relative min-h-screen overflow-x-clip bg-white text-zinc-900 dark:bg-gradient-to-br dark:from-[#0D1B2A] dark:to-[#1B263B] dark:text-slate-100'
          : 'relative min-h-screen overflow-x-clip bg-zinc-50 text-zinc-900 dark:bg-gradient-to-br dark:from-[#0D1B2A] dark:to-[#1B263B] dark:text-slate-100'
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

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:max-w-7xl xl:px-8 2xl:max-w-[min(100%,92rem)]">
        {children}
      </div>
    </div>
  );
}
