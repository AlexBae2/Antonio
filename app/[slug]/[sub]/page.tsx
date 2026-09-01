import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import TldrBlock from '@/components/TldrBlock';
import FaqBlock from '@/components/FaqBlock';
import SimilarJobs from '@/components/SimilarJobs';
import LeadForm from '@/components/LeadForm';
import Disclaimer from '@/components/Disclaimer';
import Calculator from '@/components/Calculator';
import { CITIES, getCity } from '@/lib/data/cities';
import { getService } from '@/lib/data/services';
import {
  calcIncome,
  hasCalcModel,
  CALC_DATA_DATE,
  CITY_FACTOR,
  PAY_PER_SHIFT,
  TRANSPORTS,
  TRANSPORT_PROFILE_BY_LABEL,
} from '@/lib/data/calc';
import { absUrl, SITE_YEAR } from '@/lib/site';

/** Базовая смена для расчёта в тексте: одна и та же для всех городов, чтобы цифры сравнивались */
const BASE_HOURS = 8;
const BASE_DAYS = 5;

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

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

  // Вилка с поправкой на плотность заказов в городе: считаем на сервере,
  // чтобы цифры были в тексте страницы, а не только в интерактиве.
  const cityFactor = CITY_FACTOR[city.slug] ?? CITY_FACTOR.other;
  const isShiftBased = Boolean(PAY_PER_SHIFT[service.slug]);
  const transportIds = isShiftBased
    ? ['foot']
    : [...new Set(service.transports.map((t) => TRANSPORT_PROFILE_BY_LABEL[t]).filter(Boolean))];
  const incomeRows = transportIds
    .map((id) => ({
      label: TRANSPORTS.find((t) => t.id === id)?.label ?? '',
      result: calcIncome({
        service: service.slug,
        city: city.slug,
        transport: id,
        hoursPerDay: BASE_HOURS,
        daysPerWeek: BASE_DAYS,
      }),
    }))
    .filter((row): row is { label: string; result: NonNullable<ReturnType<typeof calcIncome>> } =>
      Boolean(row.result),
    );

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
        title: `${service.brandShort} ${c.namePrepositional}`,
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
        <div className="min-w-0">
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

          {incomeRows.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-semibold">
                Сколько выходит {city.namePrepositional}
              </h2>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Ориентир при смене {BASE_HOURS} часов и {BASE_DAYS} днях в неделю.{' '}
                {cityFactor === 1
                  ? 'Москва в нашей модели идёт за базовый уровень плотности заказов.'
                  : `Расчёт учитывает поправку на плотность заказов ${city.namePrepositional}: коэффициент ${cityFactor} к московскому уровню.`}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <caption className="sr-only">
                    Ориентировочный доход {kind} {service.brandLoc} {city.namePrepositional}
                  </caption>
                  <thead>
                    <tr className="border-b-2 border-line text-left">
                      <th className="py-2 pr-3 font-semibold">{isShiftBased ? 'Формат' : 'Транспорт'}</th>
                      <th className="py-2 pr-3 font-semibold">За смену</th>
                      <th className="py-2 font-semibold">За 4 недели</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map((row) => (
                      <tr key={row.label} className="border-b border-line">
                        <td className="py-2 pr-3">{isShiftBased ? 'Смена' : row.label}</td>
                        <td className="py-2 pr-3">
                          {fmt(row.result.perShift[0])}–{fmt(row.result.perShift[1])} ₽
                        </td>
                        <td className="py-2">
                          {fmt(row.result.perMonth[0])}–{fmt(row.result.perMonth[1])} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Расчёт ориентировочный и не является гарантией дохода: итог зависит от тарифов
                сервиса, района, погоды и вашего темпа. Данные на: {CALC_DATA_DATE}, методика:{' '}
                <Link href="/metodologiya/" className="underline">
                  откуда цифры
                </Link>
                .
              </p>

              {hasCalcModel(service.slug) && (
                <div className="mt-6">
                  <h3 className="font-display text-lg font-semibold">
                    Посчитать под свой график
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    Сервис и город уже подставлены: меняйте транспорт, часы и дни.
                  </p>
                  <div className="mt-4">
                    <Calculator initialService={service.slug} initialCity={city.slug} stacked />
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Полезное перед стартом</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li>
                <Link href={`/${service.slug}/`} className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                  Официальные цифры {service.brandShort} с источниками и датой
                </Link>
              </li>
              <li>
                <Link href={`/${city.slug}/`} className="underline decoration-amber underline-offset-4 hover:text-amber-deep">
                  Другие сервисы, которые работают {city.namePrepositional}
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
