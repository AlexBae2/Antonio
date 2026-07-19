'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from '@/lib/data/cities';
import { SERVICES } from '@/lib/data/services';

const IS_DEMO = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github';

type Step = 'city' | 'age' | 'service' | 'phone' | 'done' | 'underage';

interface LeadState {
  city: string;
  cityOther: string;
  age: string;
  citizenship: string;
  service: string;
  phone: string;
  name: string;
  consent: boolean;
}

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void;
  }
}

function goal(name: string) {
  try {
    const id = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 0);
    if (id && window.ym) window.ym(id, 'reachGoal', name);
  } catch {
    /* метрика недоступна - не мешаем форме */
  }
}

function getParam(key: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) || '';
}

export default function LeadForm() {
  const [step, setStep] = useState<Step>('city');
  const [lead, setLead] = useState<LeadState>({
    city: '',
    cityOther: '',
    age: '',
    citizenship: 'РФ',
    service: '',
    phone: '',
    name: '',
    consent: false,
  });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const startedAt = useRef<number>(0);
  const draftSent = useRef(false);
  // honeypot: скрытое поле, боты его заполняют
  const [company, setCompany] = useState('');

  useEffect(() => {
    startedAt.current = Date.now();
    const preService = getParam('service');
    const preCity = getParam('city');
    setLead((l) => ({
      ...l,
      service: preService && SERVICES.some((s) => s.slug === preService) ? preService : l.service,
      city: preCity && CITIES.some((c) => c.slug === preCity) ? preCity : l.city,
    }));
  }, []);

  const steps: Step[] = ['city', 'age', 'service', 'phone'];
  const stepIndex = steps.indexOf(step);
  const progress = step === 'done' ? 100 : Math.max(0, (stepIndex / steps.length) * 100);

  const cityName = useMemo(() => {
    if (lead.city === 'other') return lead.cityOther;
    return CITIES.find((c) => c.slug === lead.city)?.name || '';
  }, [lead.city, lead.cityOther]);

  function next(to: Step, goalName: string) {
    setError('');
    goal(goalName);
    setStep(to);
  }

  function chooseCity(slug: string) {
    setLead((l) => ({ ...l, city: slug }));
    if (slug !== 'other') next('age', 'form_step_city');
  }

  function submitAge() {
    const age = Number(lead.age);
    if (!age || age < 14 || age > 80) {
      setError('Укажите возраст числом');
      return;
    }
    if (age < 18) {
      goal('form_underage');
      setStep('underage');
      return;
    }
    next('service', 'form_step_age');
  }

  function chooseService(slug: string) {
    setLead((l) => ({ ...l, service: slug }));
    next('phone', 'form_step_service');
  }

  async function sendPartial(phone: string) {
    if (draftSent.current || IS_DEMO) return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) return;
    draftSent.current = true;
    try {
      const body = JSON.stringify(payload('partial'));
      navigator.sendBeacon?.('/api/lead/', new Blob([body], { type: 'application/json' }));
    } catch {
      /* partial - best effort */
    }
  }

  function payload(status: 'partial' | 'new') {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    return {
      status,
      city: cityName,
      age: Number(lead.age) || null,
      citizenship: lead.citizenship,
      service: lead.service,
      phone: lead.phone,
      name: lead.name,
      company, // honeypot
      startedAt: startedAt.current,
      page: typeof window === 'undefined' ? '' : window.location.pathname,
      yclid: params.get('yclid') || '',
      utm: {
        source: params.get('utm_source') || '',
        medium: params.get('utm_medium') || '',
        campaign: params.get('utm_campaign') || '',
        content: params.get('utm_content') || '',
      },
      referrer: typeof document === 'undefined' ? '' : document.referrer,
    };
  }

  async function submit() {
    const digits = lead.phone.replace(/\D/g, '');
    if (digits.length < 11) {
      setError('Укажите телефон полностью: например, +7 900 123-45-67');
      return;
    }
    if (!lead.consent) {
      setError('Для отправки заявки нужно согласие на обработку данных');
      return;
    }
    setSending(true);
    setError('');
    try {
      if (IS_DEMO) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const res = await fetch('/api/lead/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload('new')),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Не получилось отправить заявку');
        }
      }
      goal('form_submit');
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось отправить. Попробуйте ещё раз');
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="zayavka" className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Заявка на подключение</h2>
        <span className="rounded-full bg-money-soft px-3 py-1 text-xs font-semibold text-money">
          Бесплатно для соискателя
        </span>
      </div>

      {/* прогресс: фиксированная высота - ноль CLS */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-amber transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <div className="mt-5 min-h-[220px]">
        {step === 'city' && (
          <fieldset>
            <legend className="font-semibold">Шаг 1. В каком городе ищете работу?</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CITIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => chooseCity(c.slug)}
                  className={`tap rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                    lead.city === c.slug ? 'border-amber bg-amber-soft' : 'border-line hover:border-amber'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => chooseCity('other')}
                className={`tap rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  lead.city === 'other' ? 'border-amber bg-amber-soft' : 'border-line hover:border-amber'
                }`}
              >
                Другой город
              </button>
            </div>
            {lead.city === 'other' && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={lead.cityOther}
                  onChange={(e) => setLead((l) => ({ ...l, cityOther: e.target.value }))}
                  placeholder="Название города"
                  className="tap w-full rounded-xl border-2 border-line px-3 text-sm outline-none focus:border-amber"
                />
                <button
                  type="button"
                  disabled={lead.cityOther.trim().length < 2}
                  onClick={() => next('age', 'form_step_city')}
                  className="tap rounded-xl bg-amber px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Дальше
                </button>
              </div>
            )}
          </fieldset>
        )}

        {step === 'age' && (
          <fieldset>
            <legend className="font-semibold">Шаг 2. Возраст и гражданство</legend>
            <p className="mt-1 text-sm text-ink-soft">
              У сервисов доставки требование: от 18 лет. Спрашиваем сразу, чтобы не тратить ваше время.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={lead.age}
                onChange={(e) => setLead((l) => ({ ...l, age: e.target.value }))}
                placeholder="Возраст"
                className="tap w-28 rounded-xl border-2 border-line px-3 text-sm outline-none focus:border-amber"
              />
              <select
                value={lead.citizenship}
                onChange={(e) => setLead((l) => ({ ...l, citizenship: e.target.value }))}
                className="tap rounded-xl border-2 border-line bg-card px-3 text-sm outline-none focus:border-amber"
              >
                <option value="РФ">Гражданство РФ</option>
                <option value="ЕАЭС">ЕАЭС (Беларусь, Казахстан, Армения, Киргизия)</option>
                <option value="другое">Другое</option>
              </select>
              <button type="button" onClick={submitAge} className="tap rounded-xl bg-amber px-5 text-sm font-semibold text-white">
                Дальше
              </button>
            </div>
          </fieldset>
        )}

        {step === 'service' && (
          <fieldset>
            <legend className="font-semibold">Шаг 3. Где хотите работать?</legend>
            <p className="mt-1 text-sm text-ink-soft">Если не уверены, выберите первый вариант: подберём вместе.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => chooseService(s.slug)}
                  className={`tap rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors ${
                    lead.service === s.slug ? 'border-amber bg-amber-soft' : 'border-line hover:border-amber'
                  }`}
                >
                  <span className="font-semibold">{s.brandShort}</span>
                  <span className="block text-xs text-ink-soft">{s.category}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 'phone' && (
          <fieldset>
            <legend className="font-semibold">Шаг 4. Куда позвонить?</legend>
            <p className="mt-1 text-sm text-ink-soft">Перезвоним в рабочее время, поможем с оформлением и ответим на вопросы.</p>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={lead.name}
                onChange={(e) => setLead((l) => ({ ...l, name: e.target.value }))}
                placeholder="Имя"
                className="tap w-full rounded-xl border-2 border-line px-3 text-sm outline-none focus:border-amber"
              />
              <input
                type="tel"
                inputMode="tel"
                value={lead.phone}
                onChange={(e) => {
                  setLead((l) => ({ ...l, phone: e.target.value }));
                  sendPartial(e.target.value);
                }}
                placeholder="+7 900 123-45-67"
                className="tap w-full rounded-xl border-2 border-line px-3 text-sm outline-none focus:border-amber"
              />
              <label className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  checked={lead.consent}
                  onChange={(e) => setLead((l) => ({ ...l, consent: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-amber"
                />
                <span>
                  Соглашаюсь на обработку персональных данных по{' '}
                  <Link href="/policy/" className="underline" target="_blank">
                    политике конфиденциальности
                  </Link>
                </span>
              </label>
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="tap w-full rounded-xl bg-amber py-3 font-semibold text-white transition-colors hover:bg-amber-deep disabled:opacity-50"
              >
                {sending ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </div>
          </fieldset>
        )}

        {step === 'done' && (
          <div className="py-6 text-center">
            <span className="mx-auto block w-fit rounded-full bg-money-soft px-4 py-1 text-sm font-semibold text-money">
              Заявка принята
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold">Перезвоним в течение 30 минут</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              В рабочее время с 9:00 до 21:00 по вашему городу. Подготовьте паспорт: с ним подключение
              пройдёт быстрее.
            </p>
            {IS_DEMO && (
              <p className="mx-auto mt-3 max-w-sm rounded-lg bg-amber-soft px-3 py-2 text-xs text-ink-soft">
                Это тестовый стенд: заявка не отправляется. На рабочем сайте она уходит в колл-центр.
              </p>
            )}
          </div>
        )}

        {step === 'underage' && (
          <div className="py-6 text-center">
            <h3 className="font-display text-xl font-semibold">Пока рано, но мы на связи</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              Сервисы доставки подключают курьеров с 18 лет: это их требование, обойти его нельзя.
              Возвращайтесь после дня рождения, а пока почитайте,{' '}
              <Link href="/blog/so-skolki-let-mozhno-rabotat-kurerom/" className="underline">
                со скольки лет и куда берут
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber-deep">{error}</p>}
    </div>
  );
}
