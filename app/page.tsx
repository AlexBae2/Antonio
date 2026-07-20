import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import FaqBlock from '@/components/FaqBlock';
import Disclaimer from '@/components/Disclaimer';
import { SERVICES, roleTag } from '@/lib/data/services';
import { ROLES } from '@/lib/data/roles';
import { CITIES } from '@/lib/data/cities';
import { absUrl, SITE_NAME, SITE_URL, SITE_YEAR } from '@/lib/site';

export const metadata: Metadata = {
  title: `Работа курьером и сборщиком заказов ${SITE_YEAR}: вакансии сервисов доставки`,
  description: `Подбор работы в доставке: курьер или сборщик заказов в 7 сервисах. Помогаем оформиться и выйти на первую смену, как правило, на следующий день. Бесплатно для соискателя.`,
  alternates: { canonical: absUrl('/') },
};

const HOME_FAQ = [
  {
    q: 'Сколько стоит подключение через вас?',
    a: 'Для соискателя всё бесплатно. Мы кадровый партнёр сервисов доставки: вознаграждение нам платят сервисы за подбор, с кандидата мы не берём ничего.',
  },
  {
    q: 'Как быстро можно начать работать?',
    a: 'Как правило, на следующий день после заявки. Скорость зависит от сервиса и готовности документов: паспорт и смартфон нужны всем, самозанятость оформляется за 15 минут, с медкнижкой поможем.',
  },
  {
    q: 'Это официальная работа?',
    a: 'Да. В большинстве сервисов вы работаете как самозанятый партнёр с договором и чеками через приложение «Мой налог», либо оформляетесь через партнёрскую организацию. Никаких серых схем.',
  },
  {
    q: 'Чем вы отличаетесь от прямой подачи заявки в сервис?',
    a: 'Мы помогаем выбрать сервис под вашу ситуацию, оформить документы и не потеряться на этапе активации: у прямых заявок до первой смены доходит меньше половины кандидатов, потому что люди застревают на шагах оформления.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-graphite text-paper grain">
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="min-w-0">
              <p className="reveal reveal-1 inline-flex items-center gap-2 rounded-full border border-line-dark px-3 py-1 text-xs font-semibold uppercase tracking-wider opacity-90">
                <span className="route-dot" aria-hidden /> 7 сервисов доставки · 5 городов
              </p>
              <h1 className="reveal reveal-2 mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
                Работа курьером и сборщиком заказов
              </h1>
              <p className="reveal reveal-3 mt-4 max-w-lg text-base leading-relaxed opacity-85 md:text-lg">
                Помогаем выбрать сервис доставки, оформить самозанятость и выйти на первую смену:
                как правило, уже на следующий день. Для соискателя бесплатно.
              </p>
              <div className="reveal reveal-4 mt-6 flex flex-wrap gap-3">
                <a
                  href="#zayavka"
                  className="tap inline-flex items-center rounded-full bg-amber px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-deep"
                >
                  Оставить заявку
                </a>
                <Link
                  href="/podbor/"
                  className="tap inline-flex items-center rounded-full border-2 border-line-dark px-6 py-3 font-semibold transition-colors hover:border-amber"
                >
                  Подобрать сервис за 1 минуту
                </Link>
              </div>
              <div className="reveal reveal-4 mt-8 flex flex-wrap items-center gap-2 text-sm opacity-75 sm:gap-3">
                <span className="route-dot" aria-hidden />
                <span className="route-line w-10 sm:w-16" aria-hidden />
                <span>заявка</span>
                <span className="route-line w-6 sm:w-8" aria-hidden />
                <span>звонок</span>
                <span className="route-line w-6 sm:w-8" aria-hidden />
                <span>оформление</span>
                <span className="route-line w-6 sm:w-8" aria-hidden />
                <span className="font-semibold text-amber">первая смена</span>
              </div>
            </div>
            <div className="md:justify-self-end">
              <div className="w-full max-w-md rounded-2xl bg-paper p-1 text-ink">
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servisy" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Куда можно устроиться</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Работаем с доставкой еды, продуктов и складами маркетплейсов. Выбирайте по формату: город
          или помещение, пешком или на транспорте, смены или свободный график.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/`}
              className="group rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{s.brandShort}</h3>
                <span className="text-xs text-ink-soft">{roleTag(s)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{s.category}</p>
              <p className="mt-3 text-sm font-semibold text-amber group-hover:text-amber-deep">
                Условия и подключение →
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Disclaimer />
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Кем работать</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}/`}
                className="rounded-2xl border border-line bg-paper p-4 transition-colors hover:border-amber"
              >
                <h3 className="font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{r.suitedFor[0]}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Города:</span>
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}/`}
                className="rounded-full border border-line px-3 py-1 transition-colors hover:border-amber"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Посчитайте свой доход</h2>
            <p className="mt-2 text-ink-soft">
              Доход курьера складывается из тарифа за заказ, коэффициентов времени и погоды, бонусов и
              чаевых. Прикиньте вилку под свой город и график в калькуляторе: без телефона и регистрации.
            </p>
            <Link
              href="/kalkulyator-dohoda/"
              className="tap mt-4 inline-flex items-center rounded-full bg-graphite px-6 py-3 font-semibold text-paper transition-opacity hover:opacity-90"
            >
              Открыть калькулятор →
            </Link>
          </div>
          <FaqBlock items={HOME_FAQ} title="Частые вопросы о подключении" />
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          description:
            'Независимый кадровый партнёр по подбору курьеров и сборщиков заказов для сервисов доставки',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
        }}
      />
    </>
  );
}
