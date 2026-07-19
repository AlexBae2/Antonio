import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { absUrl, LEGAL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'О нас: независимый кадровый партнёр сервисов доставки',
  description:
    'Кто мы и как работаем: подбираем курьеров и сборщиков для сервисов доставки, помогаем с оформлением. Для соискателя бесплатно.',
  alternates: { canonical: absUrl('/o-nas/') },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/o-nas/', label: 'О нас' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Кто мы и как работаем</h1>

      <p className="mt-4 text-lg leading-relaxed">
        {SITE_NAME}: независимый кадровый партнёр по подбору персонала для сервисов доставки. Мы
        помогаем людям устроиться курьерами и сборщиками заказов: подбираем подходящий сервис,
        сопровождаем оформление документов и доводим до первой смены.
      </p>

      <div className="mt-4 rounded-lg border border-line bg-card px-4 py-3 text-sm leading-relaxed text-ink-soft">
        {LEGAL.disclaimer} Все упоминания сервисов на сайте: только для указания, с какими компаниями
        сотрудничают наши кандидаты.
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Как мы зарабатываем</h2>
        <p className="mt-3 leading-relaxed">
          Честно и просто: сервисы доставки платят кадровым партнёрам за подбор кандидатов, которые
          реально вышли на смены. Поэтому с соискателя мы не берём ничего и не завышаем обещания:
          нам платят за людей, которые остались работать, а не за красивые цифры в объявлении.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Наши правила</h2>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Цифры дохода: только из официальных источников сервисов, с датой. Как мы их собираем: <Link href="/metodologiya/" className="underline">методология</Link>.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Никаких гарантий дохода: заработок зависит от города, графика и темпа, и мы говорим об этом прямо.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Бесплатно для соискателя: любые предложения заплатить за трудоустройство — не от нас.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Отзывы публикуем только реальные, от кандидатов с их согласия. Пока раздел наполняется: <Link href="/otzyvy/" className="underline">как мы собираем отзывы</Link>.</span>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Контакты и реквизиты</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Юридическая информация: на странице <Link href="/rekvizity/" className="underline">реквизиты</Link>.
          Обработка персональных данных: <Link href="/policy/" className="underline">политика</Link>.
        </p>
      </section>
    </div>
  );
}
