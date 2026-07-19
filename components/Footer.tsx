import Link from 'next/link';
import { LEGAL, SITE_NAME, SITE_YEAR } from '@/lib/site';
import { SERVICES } from '@/lib/data/services';
import { ROLES } from '@/lib/data/roles';
import { CITIES } from '@/lib/data/cities';

export default function Footer() {
  return (
    <footer className="border-t border-line-dark bg-graphite text-paper">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="route-dot" aria-hidden />
              <span className="font-display text-lg font-semibold">{SITE_NAME}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-75">{LEGAL.disclaimer}</p>
          </div>
          <nav aria-label="Сервисы доставки">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-60">Работа в сервисах</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${s.slug}/`} className="opacity-85 hover:opacity-100">
                    {s.category}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Роли и города">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-60">Кем работать</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {ROLES.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}/`} className="opacity-85 hover:opacity-100">
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-5 font-display text-sm font-semibold uppercase tracking-wide opacity-60">Города</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {CITIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}/`} className="opacity-85 hover:opacity-100">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Информация">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-60">Полезное</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/kalkulyator-dohoda/" className="opacity-85 hover:opacity-100">Калькулятор дохода</Link></li>
              <li><Link href="/podbor/" className="opacity-85 hover:opacity-100">Подбор работы</Link></li>
              <li><Link href="/blog/" className="opacity-85 hover:opacity-100">Блог</Link></li>
              <li><Link href="/voprosy/" className="opacity-85 hover:opacity-100">Частые вопросы</Link></li>
              <li><Link href="/slovar-terminov/" className="opacity-85 hover:opacity-100">Словарь терминов</Link></li>
              <li><Link href="/o-nas/" className="opacity-85 hover:opacity-100">О нас</Link></li>
              <li><Link href="/metodologiya/" className="opacity-85 hover:opacity-100">Откуда цифры</Link></li>
              <li><Link href="/policy/" className="opacity-85 hover:opacity-100">Политика данных</Link></li>
              <li><Link href="/rekvizity/" className="opacity-85 hover:opacity-100">Реквизиты</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 border-t border-line-dark pt-5 text-xs opacity-60">
          <p>
            {SITE_YEAR} {SITE_NAME}. Названия сервисов доставки упоминаются только для указания, с какими
            компаниями сотрудничают кандидаты. Все товарные знаки принадлежат их правообладателям.
          </p>
        </div>
      </div>
    </footer>
  );
}
