import Link from 'next/link';
import { CONTACTS } from '@/lib/site';

/**
 * Мобильный sticky-бар снизу: главный конверсионный элемент для ЦА.
 * Телефон появляется, когда контакты колл-центра заданы в lib/site.ts.
 */
export default function StickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card p-2 shadow-lift md:hidden">
      <div className="flex gap-2">
        {CONTACTS.phone && (
          <a
            href={`tel:${CONTACTS.phone.replace(/[^+\d]/g, '')}`}
            className="tap flex flex-1 items-center justify-center rounded-xl border-2 border-amber font-semibold text-amber"
          >
            Позвонить
          </a>
        )}
        {CONTACTS.telegram && (
          <a
            href={CONTACTS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в Telegram"
            className="tap flex w-12 flex-none items-center justify-center rounded-xl border-2 border-amber text-amber"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
              <path d="M21.9 4.3 18.6 20c-.25 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.27.27-.5.5-1 .5l.36-5.1 9.3-8.4c.4-.36-.09-.56-.62-.2L6.9 13.5l-5-1.56c-1.08-.34-1.1-1.08.23-1.6L20.4 3c.9-.33 1.7.2 1.5 1.3z" />
            </svg>
          </a>
        )}
        <Link
          href="/#zayavka"
          className="tap flex flex-1 items-center justify-center rounded-xl bg-amber font-semibold text-white"
        >
          Оставить заявку
        </Link>
      </div>
    </div>
  );
}
