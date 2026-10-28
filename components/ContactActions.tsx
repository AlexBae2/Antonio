import { CONTACTS } from '@/lib/site';

function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M21.9 4.3 18.6 20c-.25 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.27.27-.5.5-1 .5l.36-5.1 9.3-8.4c.4-.36-.09-.56-.62-.2L6.9 13.5l-5-1.56c-1.08-.34-1.1-1.08.23-1.6L20.4 3c.9-.33 1.7.2 1.5 1.3z" />
    </svg>
  );
}

/**
 * Кнопки связи: звонок главный, мессенджер рядом. Каналы, которых нет в
 * lib/site.ts, не показываем. Клики считает CtaClicks на уровне документа,
 * поэтому здесь обычные ссылки без обработчиков.
 */
export default function ContactActions({ ringing = false, stacked = false }: { ringing?: boolean; stacked?: boolean }) {
  if (!CONTACTS.phone && !CONTACTS.telegram) return null;
  return (
    <div className={`flex flex-col gap-2 ${stacked ? '' : 'sm:flex-row'}`}>
      {CONTACTS.phone && CONTACTS.phoneHref && (
        <a
          href={`tel:${CONTACTS.phoneHref}`}
          className="tap flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-amber px-4 font-semibold text-white shadow-card transition-colors hover:bg-amber-deep"
        >
          <PhoneIcon className={ringing ? 'phone-ring' : ''} />
          {CONTACTS.phone}
        </a>
      )}
      {CONTACTS.telegram && (
        <a
          href={CONTACTS.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-amber px-4 font-semibold text-amber transition-colors hover:bg-amber-soft"
        >
          <TelegramIcon />
          Написать в Telegram
        </a>
      )}
    </div>
  );
}
