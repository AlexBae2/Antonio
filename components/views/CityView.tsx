import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import TldrBlock from '@/components/TldrBlock';
import SimilarJobs from '@/components/SimilarJobs';
import LeadForm from '@/components/LeadForm';
import Disclaimer from '@/components/Disclaimer';
import type { City } from '@/lib/data/cities';
import { CITIES } from '@/lib/data/cities';
import { getService } from '@/lib/data/services';
import { ROLES } from '@/lib/data/roles';

export default function CityView({ city }: { city: City }) {
  const services = city.services
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const similar = CITIES.filter((c) => c.slug !== city.slug)
    .slice(0, 4)
    .map((c) => ({
      href: `/${c.slug}/`,
      title: `Работа курьером в ${c.name}`,
      note: 'вакансии сервисов доставки',
    }));

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${city.slug}/`, label: city.name }]} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            Работа курьером {city.namePrepositional}: сервисы, условия, подключение
          </h1>

          <p className="mt-4 text-lg leading-relaxed">
            {city.namePrepositional.charAt(0).toUpperCase() + city.namePrepositional.slice(1)} можно
            выйти в доставку в течение 1-2 дней: работают все крупные сервисы, подключение от 18 лет,
            оплата за заказы или смены. {city.localNote}
          </p>

          <div className="mt-4">
            <Disclaimer />
          </div>

          <div className="mt-6">
            <TldrBlock
              items={[
                `Сервисы ${city.namePrepositional}: доставка еды, продуктов, склады`,
                'Подключение от 18 лет, помогаем с документами',
                'Пешком, на велосипеде или авто',
                'Выплаты еженедельно, для соискателя бесплатно',
              ]}
            />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Куда устроиться {city.namePrepositional}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${city.slug}/${s.slug}/`}
                  className="group rounded-2xl border border-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift"
                >
                  <h3 className="font-semibold group-hover:text-amber-deep">{s.brandShort}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{s.category}</p>
                  <span className="mt-2 inline-block text-sm font-semibold text-amber">
                    Условия в {city.name} →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Кем работать</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}/`}
                  className="rounded-full border border-line px-3 py-1 text-sm transition-colors hover:border-amber"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </section>

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
