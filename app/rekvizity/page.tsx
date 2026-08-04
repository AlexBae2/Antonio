import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { absUrl, CONTACTS, LEGAL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Реквизиты',
  description: 'Юридическая информация и реквизиты оператора сайта.',
  alternates: { canonical: absUrl('/rekvizity/') },
  robots: { index: false, follow: true },
};

export default function RekvizityPage() {
  const rows: [string, string][] = [
    ['Наименование', LEGAL.orgName],
    ['ИНН', LEGAL.inn],
    ['ОГРНИП', LEGAL.ogrnip],
    ['Адрес', LEGAL.address],
    ...(CONTACTS.phone ? ([['Телефон', CONTACTS.phone]] as [string, string][]) : []),
    ['Электронная почта', LEGAL.email],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/rekvizity/', label: 'Реквизиты' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold">Реквизиты</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        <dl>
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className={`flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-4 ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <dt className="w-full text-sm text-ink-soft sm:w-48 sm:shrink-0">{label}</dt>
              <dd className="leading-relaxed">
                {label === 'Телефон' && CONTACTS.phoneHref ? (
                  <a href={`tel:${CONTACTS.phoneHref}`} className="underline decoration-amber underline-offset-4">
                    {value}
                  </a>
                ) : label === 'Электронная почта' ? (
                  <a href={`mailto:${value}`} className="underline decoration-amber underline-offset-4">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{LEGAL.disclaimer}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        По вопросам обработки персональных данных и отзыва согласия пишите на{' '}
        <a href={`mailto:${LEGAL.email}`} className="underline">
          {LEGAL.email}
        </a>
        : отвечаем в течение 30 дней.
      </p>
    </div>
  );
}
