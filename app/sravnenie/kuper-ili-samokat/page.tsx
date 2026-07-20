import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Disclaimer from '@/components/Disclaimer';
import FaqBlock from '@/components/FaqBlock';
import LeadForm from '@/components/LeadForm';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Купер или Самокат: где лучше работать курьером в 2026',
  description:
    'Сравниваем работу курьером в Купере и Самокате: формат подключения, маршруты, транспорт, заявленные цифры. По официальным данным, честно про отличия.',
  alternates: { canonical: absUrl('/sravnenie/kuper-ili-samokat/') },
};

const FAQ = [
  {
    q: 'Чем работа в Купере отличается от Самоката?',
    a: 'Купер — доставка собранных заказов из магазинов-партнёров с прямым подключением как самозанятый, радиус шире, есть авто-формат. Самокат — экспресс-доставка за 15-30 минут от своего даркстора через партнёрскую организацию, радиус меньше, темп выше.',
  },
  {
    q: 'Где быстрее подключиться?',
    a: 'В Купере регистрация занимает несколько минут онлайн, дальше оформление самозанятости и первые заказы. В Самокате подключение идёт через партнёрскую организацию с бронированием смен: обычно это на день-два дольше.',
  },
  {
    q: 'Нужен ли свой транспорт?',
    a: 'В Самокате чаще всего нет: в большинстве дарксторов выдают электровелосипед и экипировку. В Купере пеший формат не требует ничего, а для вело- и авто-форматов нужен свой транспорт.',
  },
];

export default function KuperIliSamokatPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/sravnenie/kuper-ili-samokat/', label: 'Купер или Самокат' }]} />
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            Курьером в Купер или Самокат: что выбрать
          </h1>

          <p className="mt-4 text-lg leading-relaxed">
            Коротко: Купер — прямое подключение самозанятым, заказы из магазинов и официальные цифры
            до 8 000-11 000 ₽ в день по транспорту; Самокат — экспресс-доставка от даркстора через
            партнёра, с выдачей электровелосипеда в большинстве точек. Сравнение по данным на июль
            2026 года ниже.
          </p>

          <div className="mt-4">
            <Disclaimer />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="pb-2 text-left text-xs text-ink-soft">
                Купер: официальные страницы сервиса. Самокат: данные партнёров, уточняются (официальная
                страница закрыта антибот-проверкой). Данные на: 20.07.2026
              </caption>
              <thead>
                <tr className="border-b-2 border-line text-left">
                  <th className="py-2 pr-3 font-semibold">Критерий</th>
                  <th className="py-2 pr-3 font-semibold">Купер</th>
                  <th className="py-2 font-semibold">Самокат</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Формат', 'Самозанятость, прямое подключение', 'Через партнёрскую организацию'],
                  ['Заявленные цифры', 'Пеший до 8 000 ₽/день, вело до 10 000 ₽, авто до 11 000 ₽', 'От 315 ₽/час курьер (по данным партнёров, уточняется)'],
                  ['Что возим', 'Собранные заказы из магазинов', 'Продукты от своего даркстора'],
                  ['Радиус', 'Район, для авто шире', '1.5-3 км от даркстора'],
                  ['Транспорт', 'Свой (кроме пешего формата)', 'Электровелосипед выдают в большинстве точек'],
                  ['Темп', 'Обычный: интервалы доставки шире', 'Высокий: доставка за 15-30 минут'],
                  ['Гражданство', 'РФ, ЕАЭС, Украина', 'РФ или патент (уточняется)'],
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
              <h2 className="font-display text-lg font-semibold">Купер подойдёт, если вы</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                <li>хотите подключиться напрямую и быстро</li>
                <li>планируете работать на своём авто или велосипеде</li>
                <li>предпочитаете спокойные интервалы доставки</li>
              </ul>
              <Link href="/kurier-zakazy-iz-magazinov/" className="mt-3 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
                Условия в Купере →
              </Link>
            </div>
            <div className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Самокат подойдёт, если вы</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-soft">
                <li>хотите транспорт и экипировку от сервиса</li>
                <li>любите быстрый темп и короткие маршруты</li>
                <li>готовы бронировать смены заранее</li>
              </ul>
              <Link href="/kurier-express-dostavka/" className="mt-3 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
                Условия в Самокате →
              </Link>
            </div>
          </section>

          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            Сомневаетесь: пройдите <Link href="/podbor/" className="underline">минутный тест</Link>{' '}
            или посчитайте оба варианта в{' '}
            <Link href="/kalkulyator-dohoda/" className="underline">калькуляторе дохода</Link>.
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
