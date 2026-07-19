import JsonLd from './JsonLd';

interface FaqItem {
  q: string;
  a: string;
}

/**
 * Видимый FAQ-блок (без скрытия контента) + FAQPage JSON-LD.
 * Ответы написаны в voice-answer формате: первое предложение самодостаточно.
 */
export default function FaqBlock({ items, title = 'Частые вопросы' }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.q} className="rounded-2xl border border-line bg-card p-4">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.a}</p>
          </div>
        ))}
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />
    </section>
  );
}
