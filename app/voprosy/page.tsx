import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { QUESTIONS } from '@/lib/data/questions';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Вопросы о работе курьером: короткие честные ответы',
  description:
    'Отвечаем на частые вопросы о работе в доставке: как стать курьером, сколько зарабатывают, что такое самозанятость. Коротко, по фактам сервисов.',
  alternates: { canonical: absUrl('/voprosy/') },
};

export default function VoprosyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/voprosy/', label: 'Вопросы' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Вопросы о работе в доставке</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        Короткие ответы на то, что спрашивают чаще всего. Каждый ответ: по официальным данным
        сервисов, без воды.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {QUESTIONS.map((q) => (
          <Link
            key={q.slug}
            href={`/voprosy/${q.slug}/`}
            className="group rounded-2xl border border-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift"
          >
            <h2 className="font-semibold group-hover:text-amber-deep">{q.question}?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.answer.slice(0, 120)}…</p>
          </Link>
        ))}
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: QUESTIONS.map((q, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: `${q.question}?`,
            url: absUrl(`/voprosy/${q.slug}/`),
          })),
        }}
      />
    </div>
  );
}
