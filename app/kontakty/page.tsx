import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactActions from '@/components/ContactActions';
import { absUrl, LEGAL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Контакты: позвонить или написать',
  description: 'Позвоните или напишите в Telegram или MAX: расскажем про смены и поможем выбрать сервис доставки.',
  alternates: { canonical: absUrl('/kontakty/') },
};

export default function KontaktyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/kontakty/', label: 'Контакты' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold">Позвоните или напишите</h1>
      <p className="mt-3 text-ink-soft">
        Расскажем про смены, подскажем, какие документы нужны, и поможем выбрать сервис под ваш город и транспорт.
        Звонить проще всего: так быстрее выяснить, подходит ли вам формат.
      </p>
      <div className="mt-6">
        <ContactActions ringing stacked />
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Не хотите звонить? <Link href="/#zayavka" className="underline">Оставьте заявку</Link> или{' '}
        <Link href="/podbor/" className="underline">пройдите подбор за минуту</Link>.
      </p>
      <p className="mt-6 text-xs leading-relaxed text-ink-soft">{LEGAL.disclaimer}</p>
    </div>
  );
}
