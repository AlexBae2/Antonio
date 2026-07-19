import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { SERVICES } from '@/lib/data/services';
import { TARIFF_FACTS } from '@/lib/data/tariffFacts';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Откуда цифры: методология данных о доходах курьеров',
  description:
    'Как мы собираем цифры о доходах: только официальные страницы сервисов, с датой снятия и ссылкой на источник. Что означает вилка в калькуляторе.',
  alternates: { canonical: absUrl('/metodologiya/') },
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/metodologiya/', label: 'Откуда цифры' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Откуда цифры на этом сайте</h1>

      <p className="mt-4 text-lg leading-relaxed">
        Все цифры дохода на сайте взяты с официальных страниц сервисов доставки, с указанием даты
        снятия данных. Мы не используем слухи, скриншоты из чатов и «средние по рынку» без источника.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Правила работы с цифрами</h2>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Каждая цифра сопровождается источником и датой: «по данным сервиса на [дата]».</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Заявленные сервисами максимумы («доход до X») подаются именно как заявления сервисов, не как обещание с нашей стороны.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Если официальная страница недоступна или цифры на ней нет, мы прямо пишем «уточняется» и не подставляем выдуманное значение.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Данные пересматриваются не реже раза в месяц; на страницах указана дата «Данные на».</span>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Как считает калькулятор</h2>
        <p className="mt-3 leading-relaxed">
          <Link href="/kalkulyator-dohoda/" className="underline">Калькулятор</Link> показывает вилку, а
          не точную сумму: нижняя граница — спокойный темп в обычном районе, верхняя — плотный график
          в час пик. Формула: ориентировочная оплата за заказ × заказов в час (зависит от транспорта)
          × часы × поправка на город. Ориентиры оплаты выведены из официальных дневных и месячных цифр
          сервисов. Результат — ориентир для решения, не гарантия дохода.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Текущие источники</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left">
                <th className="py-2 pr-3 font-semibold">Сервис</th>
                <th className="py-2 pr-3 font-semibold">Источник</th>
                <th className="py-2 font-semibold">Данные на</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => {
                const t = TARIFF_FACTS[s.slug];
                if (!t) return null;
                return (
                  <tr key={s.slug} className="border-b border-line">
                    <td className="py-2 pr-3">{s.brandShort}</td>
                    <td className="py-2 pr-3 text-xs text-ink-soft">{t.facts[0]?.source}</td>
                    <td className="py-2 text-xs">{t.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
