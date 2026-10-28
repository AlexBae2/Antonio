'use client';

import { useEffect } from 'react';

/**
 * Клики по телефону и по ссылкам на мессенджеры.
 *
 * Звонок для сайта главная конверсия, но до этого его не видела ни Метрика,
 * ни наша база: цель была только у формы. Слушатель один на документ, поэтому
 * ловит и StickyBar, и телефон в реквизитах, и ссылки внутри статей.
 *
 * Идентификаторы call_click и messenger_click нужно завести в Метрике как
 * JS-события, иначе вызовы уйдут в никуда. Тот же клик уходит в /api/lead-intent,
 * чтобы звонок можно было связать с yclid и выгрузить как офлайн-конверсию.
 */

const MESSENGER = /^https?:\/\/(t\.me|telegram\.me|max\.ru|wa\.me)\//i;

function kindOf(href: string): { kind: 'tel' | 'telegram' | 'max' | 'whatsapp'; goal: string } | null {
  if (href.startsWith('tel:')) return { kind: 'tel', goal: 'call_click' };
  if (!MESSENGER.test(href)) return null;
  const kind = /^https?:\/\/wa\.me\//i.test(href) ? 'whatsapp' : /^https?:\/\/max\.ru\//i.test(href) ? 'max' : 'telegram';
  return { kind, goal: 'messenger_click' };
}

function readClientId(): string {
  const m = document.cookie.match(/(?:^|;\s*)_ym_uid=(\d+)/);
  return m ? m[1] : '';
}

export default function CtaClicks() {
  useEffect(() => {
    const id = Number(process.env.NEXT_PUBLIC_METRIKA_ID || 0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a) return;
      const hit = kindOf(a.getAttribute('href') || '');
      if (!hit) return;

      try {
        if (id && window.ym) window.ym(id, 'reachGoal', hit.goal);
      } catch {
        /* метрика недоступна - не мешаем переходу */
      }
      try {
        const body = JSON.stringify({
          kind: hit.kind,
          page: location.pathname,
          clientId: readClientId(),
          yclid: new URLSearchParams(location.search).get('yclid') || '',
        });
        navigator.sendBeacon('/api/lead-intent/', new Blob([body], { type: 'application/json' }));
      } catch {
        /* beacon не критичен */
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
