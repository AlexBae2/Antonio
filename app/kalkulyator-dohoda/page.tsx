import type { Metadata } from 'next';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Calculator from '@/components/Calculator';
import FaqBlock from '@/components/FaqBlock';
import { absUrl, SITE_YEAR } from '@/lib/site';

export const metadata: Metadata = {
  title: `Калькулятор дохода курьера ${SITE_YEAR}: посчитайте заработок за смену и месяц`,
  description:
    'Бесплатный калькулятор дохода курьера: выберите сервис, город, транспорт и график — покажем ориентировочную вилку за смену, неделю и месяц. Без регистрации.',
  alternates: { canonical: absUrl('/kalkulyator-dohoda/') },
};

const CALC_FAQ = [
  {
    q: 'Из чего складывается доход курьера?',
    a: 'Доход курьера складывается из оплаты за каждый доставленный заказ, повышающих коэффициентов за время и погоду, бонусов сервиса и чаевых. У сборщиков вместо оплаты за заказ: ставка за смену.',
  },
  {
    q: 'Почему в калькуляторе диапазон, а не точная сумма?',
    a: 'Точная сумма зависит от района, погоды, времени суток и вашего темпа: в обед и вечером заказов больше, в дождь действуют повышающие коэффициенты. Диапазон честнее одной цифры.',
  },
  {
    q: 'Когда приходят выплаты?',
    a: 'В большинстве сервисов выплаты еженедельные, на карту. В некоторых сервисах доступен и более частый вывод средств: уточняйте при подключении.',
  },
];

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/kalkulyator-dohoda/', label: 'Калькулятор дохода' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Калькулятор дохода курьера</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        Выберите сервис, город и график: покажем ориентировочную вилку дохода за смену, неделю и месяц.
        Считаем по открытым тарифам сервисов, без регистрации и телефона.
      </p>
      <div className="mt-8">
        <Suspense>
          <Calculator />
        </Suspense>
      </div>
      <div className="mt-12 max-w-2xl">
        <FaqBlock items={CALC_FAQ} />
      </div>
    </div>
  );
}
