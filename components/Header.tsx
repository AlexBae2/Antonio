import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

const NAV = [
  { href: '/#servisy', label: 'Сервисы' },
  { href: '/kalkulyator-dohoda/', label: 'Калькулятор дохода' },
  { href: '/podbor/', label: 'Подбор работы' },
  { href: '/blog/', label: 'Блог' },
  { href: '/voprosy/', label: 'Вопросы' },
  { href: '/o-nas/', label: 'О нас' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-dark bg-graphite text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="tap flex items-center gap-2" aria-label={SITE_NAME}>
          <span className="route-dot" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Основная навигация">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="tap flex items-center opacity-90 transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#zayavka"
          className="tap inline-flex items-center rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-deep"
        >
          Оставить заявку
        </Link>
      </div>
    </header>
  );
}
