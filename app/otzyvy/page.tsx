import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { absUrl, SITE_NAME } from '@/lib/site';
import { resolveBlogHref } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Отзывы курьеров: как мы их собираем и проверяем',
  description:
    'Публикуем только реальные отзывы кандидатов, вышедших на смены через нас, с их согласия. Раздел наполняется: рассказываем, как устроена проверка.',
  alternates: { canonical: absUrl('/otzyvy/') },
};

export default function OtzyvyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/otzyvy/', label: 'Отзывы' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Отзывы курьеров и сборщиков</h1>

      <p className="mt-4 text-lg leading-relaxed">
        Здесь будут отзывы людей, которые устроились через {SITE_NAME} и вышли на смены. Раздел
        наполняется: мы принципиально не публикуем выдуманные отзывы, поэтому страница появится
        наполненной только когда накопятся настоящие.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Как устроена проверка</h2>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Отзыв может оставить только кандидат, который реально прошёл подключение через нас: специалист предлагает это после выхода на смену.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Публикация только с согласия автора, с указанием города, сервиса и месяца подключения.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>Негативные отзывы не удаляем: они помогают следующим кандидатам принять взвешенное решение.</span>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Пока раздел наполняется</h2>
        <p className="mt-3 leading-relaxed">
          Что почитать о реальной стороне работы: честные разборы в блоге, например{' '}
        <Link href={resolveBlogHref('/blog/rabota-kurerom-v-kupere/')} className="underline">про работу в Купере</Link> или{' '}
          <Link href={resolveBlogHref('/blog/sborshchik-zakazov-chto-za-rabota/')} className="underline">
            про будни сборщика заказов
          </Link>
          . Там мы разбираем и плюсы, и подводные камни.
        </p>
      </section>
    </div>
  );
}
