'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
}

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        className="tap flex w-12 items-center justify-center rounded-full border border-line-dark"
      >
        <span className="relative block h-3.5 w-5" aria-hidden>
          <span
            className={`absolute left-0 block h-0.5 w-5 rounded-full bg-paper transition-all duration-200 ${
              open ? 'top-1.5 rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-paper transition-opacity duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 rounded-full bg-paper transition-all duration-200 ${
              open ? 'top-1.5 -rotate-45' : 'top-3'
            }`}
          />
        </span>
      </button>

      {open && (
        <div id="mobile-nav" className="menu-drop absolute inset-x-0 top-full border-b border-line-dark bg-graphite">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 pb-2" aria-label="Меню">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="tap flex items-center border-b border-line-dark text-sm last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
