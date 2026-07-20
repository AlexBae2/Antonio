import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Disclaimer from '@/components/Disclaimer';
import TldrBlock from '@/components/TldrBlock';
import FaqBlock from '@/components/FaqBlock';
import SimilarJobs from '@/components/SimilarJobs';
import LeadForm from '@/components/LeadForm';
import type { Service } from '@/lib/data/services';
import { SERVICES } from '@/lib/data/services';
import { CITIES } from '@/lib/data/cities';
import { TARIFF_FACTS } from '@/lib/data/tariffFacts';

const CONNECTION_LABEL: Record<Service['connection'], string> = {
  direct: 'прямое подключение к сервису',
  park: 'подключение через партнёрскую организацию',
  both: 'прямое подключение или через партнёра: поможем выбрать',
};

export default function ServiceView({ service }: { service: Service }) {
  const similar = SERVICES.filter((s) => s.slug !== service.slug)
    .slice(0, 4)
    .map((s) => ({
      href: `/${s.slug}/`,
      title: `${s.role === 'picker' ? 'Сборщик' : 'Курьер'}: ${s.brandShort}`,
      note: s.category,
    }));

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${service.slug}/`, label: service.brandShort }]} />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            {service.role === 'picker' ? 'Работа сборщиком заказов' : 'Работа курьером'} {service.brandLoc}:
            как устроиться и что по деньгам
          </h1>

          {/* Прямой ответ первым абзацем: извлекаемость для LLM и быстрых ответов */}
          <p className="mt-4 text-lg leading-relaxed">
            Работа {service.role === 'picker' ? 'сборщиком заказов' : 'курьером'} {service.brandLoc} —
            это оплата за {service.role === 'picker' ? 'смены на складе' : 'выполненные заказы'},
            гибкий график и еженедельные выплаты. Подключение с {service.minAge} лет.{' '}
            {service.cooperation} Для соискателя всё бесплатно: помогаем оформить документы и выйти на
            первую смену, как правило, на следующий день после заявки.
          </p>

          <div className="mt-4">
            <Disclaimer brand={service.brand} />
          </div>

          <div className="mt-6">
            <TldrBlock items={service.tldr} />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Как устроено сотрудничество</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Формат: {CONNECTION_LABEL[service.connection]}. {service.cooperation}
            </p>
          </section>

          {TARIFF_FACTS[service.slug] && (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-semibold">Что по деньгам: цифры сервиса</h2>
              <p className="mt-2 text-sm font-semibold text-money">{TARIFF_FACTS[service.slug].headline}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <caption className="sr-only">Официальные цифры сервиса {service.brand}</caption>
                  <thead>
                    <tr className="border-b-2 border-line text-left">
                      <th className="py-2 pr-3 font-semibold">Условие</th>
                      <th className="py-2 font-semibold">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TARIFF_FACTS[service.slug].facts.map((fact) => (
                      <tr key={fact.source + fact.text.slice(0, 20)} className="border-b border-line align-top">
                        <td className="py-2 pr-3 leading-relaxed">{fact.text}</td>
                        <td className="py-2 text-xs text-ink-soft">
                          {fact.source}
                          {!fact.verified && ' (проверяется)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Данные на: {TARIFF_FACTS[service.slug].date}. Цифры заявлены сервисом и не являются
                гарантией дохода: итог зависит от города, графика и темпа работы.{' '}
                {TARIFF_FACTS[service.slug].note || ''} Методика:{' '}
                <Link href="/metodologiya/" className="underline">
                  откуда цифры
                </Link>
                .
              </p>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Требования</h2>
            <ul className="mt-3 space-y-2">
              {service.requirements.map((req) => (
                <li key={req} className="flex gap-2">
                  <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            {service.transports.length > 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                Транспорт: {service.transports.join(', ')}.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Как подключиться: 4 шага</h2>
            <ol className="mt-4 space-y-4">
              {[
                ['Заявка на сайте', 'Город, возраст и телефон: занимает меньше минуты.'],
                ['Звонок специалиста', 'Перезвоним в рабочее время, ответим на вопросы и проверим, что вам подходит по требованиям.'],
                ['Оформление', 'Поможем с самозанятостью и документами. Обычно это 15-30 минут с телефона.'],
                ['Первая смена', 'Активация в сервисе и выход на заказы: как правило, на следующий день.'],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-ink-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Города</h2>
            <p className="mt-2 text-sm text-ink-soft">Подключаем в этих городах, остальные: уточняйте в заявке.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={CITIES.find((x) => x.slug === c.slug)?.services.includes(service.slug) ? `/${c.slug}/${service.slug}/` : `/${c.slug}/`}
                  className="rounded-full border border-line px-3 py-1 text-sm transition-colors hover:border-amber"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-10">
            <FaqBlock items={service.faq} />
          </div>

          <div className="mt-10">
            <SimilarJobs items={similar} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <LeadForm />
          <p className="mt-3 text-center text-xs text-ink-soft">
            Или посчитайте доход в{' '}
            <Link href={`/kalkulyator-dohoda/?service=${service.slug}`} className="underline">
              калькуляторе
            </Link>
          </p>
        </aside>
      </div>
    </article>
  );
}
