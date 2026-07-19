import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import Quiz from '@/components/Quiz';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Подбор работы в доставке за 1 минуту: тест из 4 вопросов',
  description:
    'Ответьте на 4 вопроса про транспорт, график и формат работы: подберём сервис доставки, который подходит именно вам. Бесплатно, без телефона.',
  alternates: { canonical: absUrl('/podbor/') },
};

export default function PodborPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/podbor/', label: 'Подбор работы' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Какая работа в доставке вам подойдёт</h1>
      <p className="mt-3 text-lg leading-relaxed">
        Сервисы доставки сильно различаются: где-то нужен темп и велосипед, где-то спокойная сборка
        заказов в помещении. Ответьте на 4 вопроса: покажем 2 подходящих варианта.
      </p>
      <div className="mt-8">
        <Quiz />
      </div>
    </div>
  );
}
