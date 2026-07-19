import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import TldrBlock from '@/components/TldrBlock';
import FaqBlock from '@/components/FaqBlock';
import SimilarJobs from '@/components/SimilarJobs';
import LeadForm from '@/components/LeadForm';
import Disclaimer from '@/components/Disclaimer';
import { CITIES, getCity } from '@/lib/data/cities';
import { getService } from '@/lib/data/services';
import { absUrl, SITE_YEAR } from '@/lib/site';

interface Params {
  slug: string;
  sub: string;
}

/** Гео-волна 1: только валидные связки город × сервис из cities.ts */
export function generateStaticParams(): Params[] {
  return CITIES.flatMap((city) => city.services.map((service) => ({ slug: city.slug, sub: service })));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, sub } = await params;
  const city = getCity(slug);
  const service = getService(sub);
  if (!city || !service) return {};
  const kind = service.role === 'picker' ? 'сборщиком' : 'курьером';
  return {
    title: `${city.name}: работа ${kind} ${service.brandLoc} — условия и подключение ${SITE_YEAR}`,
    description: `Как устроиться ${kind} ${service.brandLoc} ${city.namePrepositional}: требования от ${service.minAge} лет, оформление за 1-2 дня, еженедельные выплаты. Бесплатно для соискателя.`,
    alternates: { canonical: absUrl(`/${slug}/${sub}/`) },
  };
}

export default async function CityServicePage({ params }: { params: Promise<Params> }) {
  const { slug, sub } = await params;
  const city = getCity(slug);
  const service = getService(sub);
  if (!city || !service || !city.services.includes(sub)) notFound();

  const kind = service.role === 'picker' ? 'сборщиком заказов' : 'курьером';
  const similar = [
    ...city.services
      .filter((s) => s !== sub)
      .map((s) => getService(s))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        href: `/${city.slug}/${s.slug}/`,
        title: `${s.brandShort} ${city.namePrepositional}`,
        note: s.category,
      })),
    ...CITIES.filter((c) => c.slug !== slug && c.services.includes(sub))
      .slice(0, 2)
      .map((c) => ({
        href: `/${c.slug}/${sub}/`,
        title: `${service.brandShort} в ${c.name}`,
        note: service.category,
      })),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: `/${city.slug}/`, label: city.name },
          { href: `/${city.slug}/${service.slug}/`, label: service.brandShort },
        ]}
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            {city.name}: работа {kind} {service.brandLoc}
          </h1>

          <p className="mt-4 text-lg leading-relaxed">
            Устроиться {kind} {service.brandLoc} {city.namePrepositional} можно с {service.minAge} лет:
            подключение занимает 1-2 дня, оплата за{' '}
            {service.role === 'picker' ? 'смены' : 'выполненные заказы'} с еженедельными выплатами.{' '}
            {city.localNote}
          </p>

          <div className="mt-4">
            <Disclaimer brand={service.brand} />
          </div>

          <div className="mt-6">
            <TldrBlock
              items={[
                `${service.brandShort} ${city.namePrepositional}: ${service.category.toLowerCase()}`,
                ...service.tldr.slice(0, 3),
              ]}
            />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Условия {city.namePrepositional}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{service.cooperation}</p>
            <p className="mt-2 leading-relaxed text-ink-soft">{service.incomeNote}</p>
            <ul className="mt-4 space-y-2">
              {service.requirements.map((req) => (
                <li key={req} className="flex gap-2">
                  <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Полезное перед стартом</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li>
                <Link href={`/kalkulyator-dohoda/?service=${service.slug}&city=${city.slug}`} className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                  Посчитать доход {kind} {city.namePrepositional}
                </Link>
              </li>
              <li>
                <Link href={`/${service.slug}/`} className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                  Подробнее о работе {service.brandLoc}: полные условия
                </Link>
              </li>
              <li>
                <Link href="/blog/" className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                  Гайды для новичков в блоге
                </Link>
              </li>
            </ul>
          </section>

          <div className="mt-10">
            <FaqBlock items={service.faq.slice(0, 2)} />
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
