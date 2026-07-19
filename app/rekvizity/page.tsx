import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { absUrl, LEGAL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Реквизиты',
  description: 'Юридическая информация и реквизиты оператора сайта.',
  alternates: { canonical: absUrl('/rekvizity/') },
  robots: { index: false, follow: true },
};

export default function RekvizityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/rekvizity/', label: 'Реквизиты' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold">Реквизиты</h1>
      <div className="mt-6 rounded-2xl border border-line bg-card p-5 leading-relaxed">
        <p>{LEGAL.orgName}</p>
        <p className="mt-3 text-sm text-ink-soft">
          Полные реквизиты (наименование, ИНН, ОГРН, адрес, контактный e-mail) будут опубликованы на
          этой странице перед запуском приёма заявок. До этого момента сайт работает в тестовом
          режиме и заявки не обрабатываются.
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{LEGAL.disclaimer}</p>
    </div>
  );
}
