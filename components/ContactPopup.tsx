'use client';

import { useEffect, useState } from 'react';
import ContactActions from '@/components/ContactActions';

const SHOW_AFTER_MS = 25000;
const SHOW_AFTER_SCROLL = 0.4;
const STORAGE_KEY = 'contact-popup-closed';

/**
 * Прыгающий попап с контактами на главной.
 *
 * Появляется не сразу: после 25 секунд на странице или когда прокрутили
 * 40% страницы, что раньше. Влетает с отскоком и дальше раз в пару
 * секунд подпрыгивает, пока его не закроют. Закрытие помним на время сессии,
 * чтобы он не возвращался при каждом переходе на главную.
 */
export default function ContactPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* хранилище закрыто - просто покажем */
    }
    const show = () => setVisible(true);
    const t = setTimeout(show, SHOW_AFTER_MS);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SHOW_AFTER_SCROLL) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  function close() {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* не критично */
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Связаться с нами"
      className="contact-popup fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-sm md:bottom-6 md:left-auto md:right-6 md:mx-0"
    >
      <div className="contact-popup-hop relative rounded-2xl border border-line bg-card p-4 shadow-lift">
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-amber-soft"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p className="pr-8 font-display text-lg font-semibold leading-snug">Проще позвонить</p>
        <p className="mb-3 mt-1 text-sm text-ink-soft">Расскажем про смены и поможем выбрать сервис.</p>
        <ContactActions ringing stacked />
      </div>
    </div>
  );
}
