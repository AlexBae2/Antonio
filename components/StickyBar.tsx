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
