export const IS_GITHUB = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Прод-домен ещё не куплен. До покупки canonical/OG собираются от плейсхолдера,
// стенд на GitHub Pages полностью закрыт noindex, так что наружу это не утекает.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://na-smenu.example';

export const SITE_NAME = 'НаСмену';
export const SITE_TAGLINE = 'Работа курьером и сборщиком заказов в сервисах доставки';
export const SITE_YEAR = 2026;

// Контакты колл-центра. Пока Антонио не передал номер и бота - null:
// компоненты CTA автоматически прячут звонок/мессенджеры и оставляют форму.
export const CONTACTS: {
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
} = {
  phone: null,
  telegram: null,
  whatsapp: null,
};

export const LEGAL = {
  // Реквизиты юрлица - блокер (г) Фазы 0, заполняются перед продом.
  orgName: 'Независимый кадровый партнёр (реквизиты уточняются)',
  disclaimer:
    'Мы независимый кадровый партнёр по подбору персонала для сервисов доставки. ' +
    'Мы не являемся сервисами доставки, их представителями или работодателями от их имени.',
};

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
