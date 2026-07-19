import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { GLOSSARY } from '@/lib/data/glossary';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Словарь курьера: слоты, дарксторы, коэффициенты простыми словами',
  description:
    'Термины работы в доставке одним списком: что такое слот, даркстор, повышающий коэффициент, НПД, ТСД и ещё 25 понятий, которые встретятся новичку.',
  alternates: { canonical: absUrl('/slovar-terminov/') },
};

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/slovar-terminov/', label: 'Словарь терминов' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Словарь курьера и сборщика</h1>
      <p className="mt-3 text-lg leading-relaxed">
        {GLOSSARY.length} терминов, которые встретятся при подключении и в первые недели работы.
        Коротко и без канцелярита.
      </p>
      <dl className="mt-8 space-y-5">
        {GLOSSARY.map((t) => (
          <div key={t.id} id={t.id} className="scroll-mt-24 rounded-2xl border border-line bg-card p-4">
            <dt className="font-display font-semibold">{t.term}</dt>
            <dd className="mt-1 leading-relaxed text-ink-soft">{t.def}</dd>
          </div>
        ))}
      </dl>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: 'Словарь курьера и сборщика',
          url: absUrl('/slovar-terminov/'),
          hasDefinedTerm: GLOSSARY.map((t) => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.def,
            url: absUrl(`/slovar-terminov/#${t.id}`),
          })),
        }}
      />
    </div>
  );
}
