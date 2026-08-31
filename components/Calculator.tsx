'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { SERVICES } from '@/lib/data/services';
import { CITIES } from '@/lib/data/cities';
import { calcIncome, CALC_DATA_DATE, TRANSPORTS, PAY_PER_SHIFT, hasCalcModel } from '@/lib/data/calc';

// Только сервисы с моделью дохода: такси исключено (грязный доход)
const CALC_SERVICES = SERVICES.filter((s) => hasCalcModel(s.slug));

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void;
  }
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

interface CalculatorProps {
  /** предзаполнение, когда калькулятор встроен в страницу сервиса или города */
  initialService?: string;
  initialCity?: string;
  /** одна колонка: калькулятор стоит в узком контенте, а не на своей странице */
  stacked?: boolean;
}

export default function Calculator({ initialService, initialCity, stacked = false }: CalculatorProps = {}) {
  const embedded = Boolean(initialService || initialCity);
  const [service, setService] = useState(() =>
    initialService && hasCalcModel(initialService) ? initialService : 'kurier-dostavka-edy',
  );
  const [city, setCity] = useState(() =>
    initialCity && CITIES.some((x) => x.slug === initialCity) ? initialCity : 'moskva',
  );
  const [transport, setTransport] = useState('foot');
  const [hours, setHours] = useState(6);
  const [days, setDays] = useState(5);
  const counted = useRef(false);

  useEffect(() => {
    // на встроенном калькуляторе сервис и город задаёт сама страница
    if (embedded) return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get('service');
    const c = params.get('city');
    if (s && hasCalcModel(s)) setService(s);
    if (c && CITIES.some((x) => x.slug === c)) setCity(c);
  }, [embedded]);

  /**
   * Цель шлём по первому действию пользователя, а не по факту отрисовки:
   * калькулятор встроен в гео-страницы, и на рендер цель срабатывала бы
   * на каждом визите, а по ней могут обучаться стратегии Директа.
   */
  function markUsed() {
    if (counted.current) return;
    counted.current = true;
    try {
      const id = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 0);
      if (id && window.ym) window.ym(id, 'reachGoal', 'calc_used');
    } catch {
      /* необязательно */
    }
  }

  const isShiftBased = Boolean(PAY_PER_SHIFT[service]);

  const result = useMemo(
    () => calcIncome({ service, city, transport, hoursPerDay: hours, daysPerWeek: days }),
    [service, city, transport, hours, days],
  );

  return (
    <div className={stacked ? 'grid gap-6' : 'grid gap-6 lg:grid-cols-[1fr_380px]'}>
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Сервис</span>
            <select
              value={service}
              onChange={(e) => {
                markUsed();
                setService(e.target.value);
              }}
              className="tap mt-1 w-full rounded-xl border-2 border-line bg-card px-3 text-sm outline-none focus:border-amber"
            >
              {CALC_SERVICES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.brandShort}: {s.category}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Город</span>
            <select
              value={city}
              onChange={(e) => {
                markUsed();
                setCity(e.target.value);
              }}
              className="tap mt-1 w-full rounded-xl border-2 border-line bg-card px-3 text-sm outline-none focus:border-amber"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value="other">Другой город</option>
            </select>
          </label>

          {!isShiftBased && (
            <fieldset>
              <legend className="text-sm font-semibold">Транспорт</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {TRANSPORTS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      markUsed();
                      setTransport(t.id);
                    }}
                    className={`tap hyphens-auto rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                      transport === t.id ? 'border-amber bg-amber-soft' : 'border-line hover:border-amber'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className="block">
            <span className="text-sm font-semibold">
              {isShiftBased ? 'Смен в неделю' : `Часов в день: ${hours}`}
            </span>
            {isShiftBased ? (
              <input
                type="range"
                min={2}
                max={7}
                value={days}
                onChange={(e) => {
                  markUsed();
                  setDays(Number(e.target.value));
                }}
                className="mt-2 h-11 w-full accent-amber"
              />
            ) : (
              <input
                type="range"
                min={2}
                max={12}
                value={hours}
                onChange={(e) => {
                  markUsed();
                  setHours(Number(e.target.value));
                }}
                className="mt-2 h-11 w-full accent-amber"
              />
            )}
          </label>

          {!isShiftBased && (
            <label className="block">
              <span className="text-sm font-semibold">Дней в неделю: {days}</span>
              <input
                type="range"
                min={1}
                max={7}
                value={days}
                onChange={(e) => {
                  markUsed();
                  setDays(Number(e.target.value));
                }}
                className="mt-2 h-11 w-full accent-amber"
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl bg-graphite p-5 text-paper">
        <h2 className="font-display text-lg font-semibold">Ориентировочный доход</h2>
        {result ? (
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide opacity-60">
                {result.isShiftBased ? 'За смену' : `За смену (${hours} ч)`}
              </dt>
              <dd className="font-display text-2xl font-bold text-amber">
                {fmt(result.perShift[0])}–{fmt(result.perShift[1])} ₽
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide opacity-60">За неделю ({days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'})</dt>
              <dd className="font-display text-2xl font-bold">
                {fmt(result.perWeek[0])}–{fmt(result.perWeek[1])} ₽
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide opacity-60">За 4 недели</dt>
              <dd className="font-display text-3xl font-bold text-money">
                {fmt(result.perMonth[0])}–{fmt(result.perMonth[1])} ₽
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm opacity-75">Выберите сервис и транспорт</p>
        )}
        <Link
          href={embedded ? '#zayavka' : `/?service=${service}&city=${city}#zayavka`}
          className="tap mt-6 inline-flex items-center justify-center rounded-xl bg-amber px-5 py-3 font-semibold text-white transition-colors hover:bg-amber-deep"
        >
          Оставить заявку на эти условия
        </Link>
        <p className="mt-4 text-xs leading-relaxed opacity-60">
          Расчёт ориентировочный и не является гарантией дохода. Итог зависит от тарифов сервиса,
          района, погоды и вашего темпа. Данные на: {CALC_DATA_DATE}, методика:{' '}
          <Link href="/metodologiya/" className="underline">
            откуда цифры
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
