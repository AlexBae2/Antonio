'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Цели вовлечённости: глубина просмотра и время на странице.
 *
 * Нужны, чтобы «люди стали дольше читать» можно было проверить по цифрам, а не
 * на глаз: в Метрике до этого были только цели формы, калькулятора и квиза.
 * Идентификаторы (scroll_50, scroll_90, time_60) нужно завести в интерфейсе
 * Метрики как JS-события, иначе события уйдут в никуда.
 *
 * Время считаем только пока вкладка открыта: фоновая вкладка не должна
 * засчитываться как чтение, иначе цель врёт в нашу пользу.
 */

const SCROLL_MARKS: [number, string][] = [
  [50, 'scroll_50'],
  [90, 'scroll_90'],
];

const TIME_GOAL_SECONDS = 60;
const TICK_MS = 5000;

export default function Engagement() {
  const pathname = usePathname();

  useEffect(() => {
    const id = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 0);
    if (!id) return;

    const fired = new Set<string>();
    const send = (name: string) => {
      if (fired.has(name)) return;
      fired.add(name);
      try {
        if (window.ym) window.ym(id, 'reachGoal', name);
      } catch {
        /* метрика недоступна - не мешаем странице */
      }
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const percent = (window.scrollY / max) * 100;
      for (const [mark, name] of SCROLL_MARKS) {
        if (percent >= mark) send(name);
      }
    };

    let visibleSeconds = 0;
    const tick = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      visibleSeconds += TICK_MS / 1000;
      if (visibleSeconds >= TIME_GOAL_SECONDS) {
        send('time_60');
        window.clearInterval(tick);
      }
    }, TICK_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearInterval(tick);
    };
  }, [pathname]);

  return null;
}
