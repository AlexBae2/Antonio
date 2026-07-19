import Link from 'next/link';

export interface SimilarJob {
  href: string;
  title: string;
  note: string;
}

/** Блок «Похожие вакансии»: внутренние переходы + глубина просмотра */
export default function SimilarJobs({ items }: { items: SimilarJob[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Похожие вакансии">
      <h2 className="font-display text-2xl font-semibold">Похожие вакансии</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((job) => (
          <Link
            key={job.href}
            href={job.href}
            className="group rounded-2xl border border-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift"
          >
            <h3 className="font-semibold group-hover:text-amber-deep">{job.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{job.note}</p>
            <span className="mt-2 inline-block text-sm font-semibold text-amber">Смотреть →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
