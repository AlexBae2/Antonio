import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import TldrBlock from '@/components/TldrBlock';
import FaqBlock from '@/components/FaqBlock';
import SimilarJobs from '@/components/SimilarJobs';
import LeadForm from '@/components/LeadForm';
import Disclaimer from '@/components/Disclaimer';
import type { Role } from '@/lib/data/roles';
import { ROLES } from '@/lib/data/roles';
import { getService } from '@/lib/data/services';

export default function RoleView({ role }: { role: Role }) {
  const services = role.services
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const similar = ROLES.filter((r) => r.slug !== role.slug).map((r) => ({
    href: `/${r.slug}/`,
    title: r.name,
    note: r.suitedFor[0],
  }));

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${role.slug}/`, label: role.name }]} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            {role.name}: вакансии без опыта, свободный график
          </h1>

          <p className="mt-4 text-lg leading-relaxed">{role.description}</p>

          <div className="mt-4">
            <Disclaimer />
          </div>

          <div className="mt-6">
            <TldrBlock items={role.tldr} />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Кому подходит</h2>
            <ul className="mt-3 space-y-2">
              {role.suitedFor.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
                  <span className="capitalize">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Где работать {role.nameInstrumental}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}/`}
                  className="group rounded-2xl border border-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift"
                >
                  <h3 className="font-semibold group-hover:text-amber-deep">{s.brandShort}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{s.category}</p>
                  <span className="mt-2 inline-block text-sm font-semibold text-amber">Условия →</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-10">
            <FaqBlock items={role.faq} />
          </div>

          <div className="mt-10">
            <SimilarJobs items={similar} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <LeadForm />
        </aside>
      </div>
    </article>
  );
}
