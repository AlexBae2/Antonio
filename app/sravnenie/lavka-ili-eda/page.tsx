import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Disclaimer from '@/components/Disclaimer';
import FaqBlock from '@/components/FaqBlock';
import LeadForm from '@/components/LeadForm';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Яндекс Лавка или Яндекс Еда: где лучше работать курьером в 2026',
  description:
    'Сравниваем работу курьером в Лавке и Еде по официальным данным: формат, маршруты, график, заявленные цифры дохода. Помогаем выбрать под вашу ситуацию.',
  alternates: { canonical: absUrl('/sravnenie/lavka-ili-eda/') },
};

const FAQ = [
  {
    q: 'Где проще начать новичку: в Лавке или в Еде?',
    a: 'Новичку обычно проще в Лавке: короткие маршруты от одного даркстора, знакомый район и помещение для ожидания между заказами. В Еде шире география и больше самостоятельности: заказы возят по всему району от разных ресторанов.',
  },
  {
    q: 'Можно ли совмещать оба сервиса?',
    a: 'Да, запрета нет: самозанятый курьер может сотрудничать с несколькими сервисами параллельно. На практике совмещают редко: удобнее выбрать один основной под свой график и район.',
  },
  {
    q: 'Что выгоднее по деньгам?',
    a: 'Однозначного ответа нет: итог зависит от города, района и графика. Еда заявляет более высокие максимумы для Москвы, Лавка даёт предсказуемую почасовую модель у партнёров. Прикиньте оба варианта в калькуляторе под свои часы.',
  },
];

export default function LavkaIliEdaPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: '/sravnenie/lavka-ili-eda/', label: 'Лавка или Еда' },
        ]}
      />
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            Курьером в Яндекс Лавку или Яндекс Еду: что выбрать
          </h1>

          <p className="mt-4 text-lg leading-relaxed">
            Коротко: Лавка — это короткие маршруты от одного даркстора и почасовая модель у
            партнёров, Еда — оплата за заказы, шире география и выше заявленные максимумы дохода.
            Ниже сравнение по официальным данным сервисов на июль 2026 года.
          </p>

          <div className="mt-4">
            <Disclaimer />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="pb-2 text-left text-xs text-ink-soft">
                По официальным страницам сервисов. Данные на: 20.07.2026
              </caption>
              <thead>
                <tr className="border-b-2 border-line text-left">
                  <th className="py-2 pr-3 font-semibold">Критерий</th>
                  <th className="py-2 pr-3 font-semibold">Яндекс Лавка</th>
                  <th className="py-2 font-semibold">Яндекс Еда</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Формат', 'ГПХ у партнёров сервиса', 'Самозанятость или партнёрская организация'],
                  ['Заявленный доход', 'До 85 500 ₽/мес (сборщик, Москва, подработка)', 'До 250 000 ₽/мес (Москва)'],
                  ['Маршруты', 'Радиус 1.5-2 км от даркстора', 'По району, от разных ресторанов'],
                  ['Транспорт', 'Велосипед (курьер), без транспорта (сборщик)', 'Пешком, вело, авто'],
                  ['График', '5/2 или 2/2 на выбор', 'Свободные слоты в приложении'],
                  ['Возраст', 'От 18 лет (уточняется)', 'Гражданам РФ с 16 лет, самозанятость с 18'],
                  ['Между заказами', 'Ожидание в помещении даркстора', 'На улице или в заведениях'],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-b border-line align-top">
                    <td className="py-2 pr-3 font-semibold">{k}</td>
                    <td className="py-2 pr-3 leading-relaxed">{a}</td>
                    <td className="py-2 leading-relaxed">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Лавка подойдёт, если вы</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                <li>хотите работать в одном районе без дальних поездок</li>
                <li>цените предсказуемый график смен</li>
                <li>не готовы вкладываться в транспорт</li>
              </ul>
              <Link href="/kurier-produkty-darkstore/" className="mt-3 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
                Условия в Лавке →
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Еда подойдёт, если вы</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                <li>хотите полностью свободный график по слотам</li>
                <li>готовы ездить по району ради больших максимумов</li>
                <li>рассматриваете работу на авто или велосипеде</li>
              </ul>
              <Link href="/kurier-dostavka-edy/" className="mt-3 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
                Условия в Еде →
              </Link>
            </div>
          </section>

          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            Не хочется выбирать вручную: пройдите{' '}
            <Link href="/podbor/" className="underline">минутный тест</Link> или сразу посчитайте
            вилку в <Link href="/kalkulyator-dohoda/" className="underline">калькуляторе дохода</Link>.
          </p>

          <div className="mt-10">
            <FaqBlock items={FAQ} />
          </div>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <LeadForm />
        </aside>
      </div>
    </article>
  );
}
