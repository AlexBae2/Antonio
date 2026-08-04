export const IS_GITHUB = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Прод-домен зарегистрирован 30.07.2026, NS делегированы на Timeweb.
// Стенд на GitHub Pages закрыт noindex, но canonical/OG собираем уже от прода.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smenaru.ru';

export const SITE_NAME = 'Смена.ру';
export const SITE_TAGLINE = 'Работа курьером и сборщиком заказов в сервисах доставки';
export const SITE_YEAR = 2026;

// Контакты колл-центра. Телеграм и WhatsApp появятся, когда будет бот:
// компоненты CTA сами прячут недоступные каналы.
export const CONTACTS: {
  phone: string | null;
  phoneHref: string | null;
  telegram: string | null;
  whatsapp: string | null;
} = {
  phone: '+7 904 999-34-12',
  phoneHref: '+79049993412',
  telegram: null,
  whatsapp: null,
};

/**
 * Реквизиты оператора сайта. Публикуем только то, что положено раскрывать:
 * наименование, ИНН, ОГРНИП, адрес и контакты. Банковские реквизиты на сайт
 * не выносим - они нужны только в договорах и счетах.
 */
export const LEGAL = {
  orgName: 'ИП Кочеров Евгений Антонович',
  ownerName: 'Кочеров Евгений Антонович',
  inn: '420533957929',
  ogrnip: '323420500111313',
  address: '650903, Кемеровская область, г. Кемерово, ул. Линейная 1-я, д. 14',
  email: 'info@smenaru.ru',
  disclaimer:
    'Мы независимый кадровый партнёр по подбору персонала для сервисов доставки. ' +
    'Мы не являемся сервисами доставки, их представителями или работодателями от их имени.',
};

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
