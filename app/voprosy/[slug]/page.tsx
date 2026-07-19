import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import { QUESTIONS, getQuestion } from '@/lib/data/questions';
import { SERVICES } from '@/lib/data/services';
import { TARIFF_FACTS } from '@/lib/data/tariffFacts';
import { absUrl } from '@/lib/site';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return QUESTIONS.map((q) => ({ slug: q.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const q = getQuestion(slug);
  if (!q) return {};
  return {
    title: `${q.question}? Короткий ответ по данным сервисов`,
    description: q.answer.slice(0, 155),
    alternates: { canonical: absUrl(`/voprosy/${slug}/`) },
  };
}

export default async function QuestionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const q = getQuestion(slug);
  if (!q) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: '/voprosy/', label: 'Вопросы' },
          { href: `/voprosy/${q.slug}/`, label: q.question },
        ]}
      />
      <h1 className="mt-4 font-display text-3xl font-bold leading-tight">{q.question}?</h1>
      <p className="mt-4 rounded-2xl border-l-4 border-amber bg-card p-4 text-lg leading-relaxed shadow-card">
        {q.answer}
      </p>
      {q.body.map((para) => (
        <p key={para.slice(0, 30)} className="mt-4 leading-relaxed">
          {para}
        </p>
      ))}

      {q.withPayTable && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="pb-2 text-left text-xs text-ink-soft">
              Заявленные сервисами цифры с официальных страниц. Данные на: 20.07.2026
            </caption>
            <thead>
              <tr className="border-b-2 border-line text-left">
                <th className="py-2 pr-3 font-semibold">Сервис</th>
                <th className="py-2 font-semibold">Заявленная цифра</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => {
                const t = TARIFF_FACTS[s.slug];
                if (!t) return null;
                return (
                  <tr key={s.slug} className="border-b border-line align-top">
                    <td className="py-2 pr-3">
                      <Link href={`/${s.slug}/`} className="underline decoration-amber underline-offset-4">
                        {s.brandShort}
                      </Link>
                    </td>
                    <td className="py-2 leading-relaxed">{t.headline}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Разобраться глубже</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          {q.related.map((rel) => (
            <li key={rel.href}>
              <Link href={rel.href} className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                {rel.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `${q.question}?`,
              acceptedAnswer: { '@type': 'Answer', text: q.answer },
            },
          ],
        }}
      />
    </article>
  );
}
