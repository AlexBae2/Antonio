'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SERVICES } from '@/lib/data/services';

interface Answers {
  place: 'street' | 'indoor' | '';
  transport: 'foot' | 'bike' | 'car' | '';
  time: 'part' | 'full' | '';
  priority: 'fast' | 'stable' | '';
}

function recommend(a: Answers): string[] {
  if (a.place === 'indoor') return ['sborshchik-marketpleys', 'kurier-express-dostavka'];
  if (a.transport === 'car') return ['kurier-zakazy-iz-magazinov', 'kurier-dostavka-edy'];
  if (a.time === 'part') {
    return a.priority === 'fast'
      ? ['kurier-produkty-darkstore', 'kurier-dostavka-edy']
      : ['kurier-dostavka-edy', 'kurier-produkty-darkstore'];
  }
  if (a.priority === 'stable') return ['kurier-express-dostavka', 'kurier-zdorovoe-pitanie'];
  return ['kurier-dostavka-edy', 'kurier-zakazy-iz-magazinov'];
}

const QUESTIONS: {
  key: keyof Answers;
  title: string;
  options: { value: string; label: string; note: string }[];
}[] = [
  {
    key: 'place',
    title: 'Где комфортнее работать?',
    options: [
      { value: 'street', label: 'В движении по городу', note: 'доставка заказов' },
      { value: 'indoor', label: 'В помещении', note: 'склад или даркстор' },
    ],
  },
  {
    key: 'transport',
    title: 'Какой транспорт есть?',
    options: [
      { value: 'foot', label: 'Никакого, пешком', note: 'старт без вложений' },
      { value: 'bike', label: 'Велосипед или самокат', note: 'больше заказов в час' },
      { value: 'car', label: 'Автомобиль', note: 'крупные заказы' },
    ],
  },
  {
    key: 'time',
    title: 'Сколько времени готовы работать?',
    options: [
      { value: 'part', label: '2-4 часа в день', note: 'подработка' },
      { value: 'full', label: 'Полный день', note: 'основной доход' },
    ],
  },
  {
    key: 'priority',
    title: 'Что важнее?',
    options: [
      { value: 'fast', label: 'Начать как можно быстрее', note: 'выйти на смену завтра' },
      { value: 'stable', label: 'Стабильный график', note: 'смены по расписанию' },
    ],
  },
];

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ place: '', transport: '', time: '', priority: '' });

  const done = step >= QUESTIONS.length || (answers.place === 'indoor' && step >= 1);
  const recommendations = done
    ? recommend(answers)
        .map((slug) => SERVICES.find((s) => s.slug === slug))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
    : [];

  function answer(key: keyof Answers, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep((s) => s + 1);
    if (step === QUESTIONS.length - 1 || (key === 'place' && value === 'indoor')) {
      try {
        const id = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 0);
        if (id && window.ym) window.ym(id, 'reachGoal', 'quiz_complete');
      } catch {
        /* необязательно */
      }
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="font-display text-xl font-semibold">Вам подойдёт</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {recommendations.map((s, i) => (
            <div key={s.slug} className={`rounded-2xl border-2 p-4 ${i === 0 ? 'border-amber bg-amber-soft' : 'border-line'}`}>
              {i === 0 && <span className="text-xs font-bold uppercase tracking-wide text-amber-deep">Лучший вариант</span>}
              <h3 className="mt-1 font-display font-semibold">{s.brandShort}</h3>
              <p className="mt-1 text-sm text-ink-soft">{s.category}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/?service=${s.slug}#zayavka`}
                  className="tap inline-flex items-center rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white hover:bg-amber-deep"
                >
                  Оставить заявку
                </Link>
                <Link
                  href={`/${s.slug}/`}
                  className="tap inline-flex items-center rounded-full border-2 border-line px-4 py-2 text-sm font-semibold hover:border-amber"
                >
                  Условия
                </Link>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setAnswers({ place: '', transport: '', time: '', priority: '' });
          }}
          className="mt-4 text-sm text-ink-soft underline"
        >
          Пройти заново
        </button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          Вопрос {step + 1} из {QUESTIONS.length}
        </span>
        <span>~1 минута</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-amber transition-all duration-300"
          style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">{q.title}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => answer(q.key, opt.value)}
            className="tap rounded-xl border-2 border-line px-4 py-3 text-left transition-colors hover:border-amber"
          >
            <span className="font-semibold">{opt.label}</span>
            <span className="block text-sm text-ink-soft">{opt.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
