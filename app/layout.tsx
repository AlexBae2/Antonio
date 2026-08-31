import type { Metadata } from 'next';
import './globals.css';
import { BASE_PATH, IS_GITHUB, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StickyBar from '@/components/StickyBar';
import Metrika from '@/components/Metrika';
import Engagement from '@/components/Engagement';

/*
  Шрифты лежат в public/fonts и подключаются своим CSS, а не через next/font/google.
  Причина: next/font тянет файлы с fonts.gstatic.com во время сборки, и когда домен
  недоступен, падает весь деплой (поймали 16.08.2026 - легли и локальная сборка,
  и CI). Свои файлы убирают внешнюю зависимость и лишний round-trip у посетителя.
  Пути внутри fonts.css относительные, поэтому basePath стенда учитывается сам.
*/

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Подбор работы курьером и сборщиком заказов в сервисах доставки: помогаем выбрать сервис, оформить самозанятость и выйти на первую смену. Бесплатно для соискателя.',
  // Стенд на GitHub Pages полностью закрыт от индексации и AI-краулеров
  robots: IS_GITHUB ? { index: false, follow: false } : { index: true, follow: true },
  // Подтверждение прав в Search Console (наш аккаунт) и Вебмастере (аккаунт Антонио).
  // Метатеги удалять нельзя даже после успешной проверки: оба сервиса перепроверяют
  // их периодически и снимают подтверждение, если тег пропал. На стенде не нужны -
  // коды выданы на smenaru.ru.
  verification: IS_GITHUB
    ? undefined
    : {
        google: 'ifAGt54yNVSHW7zZZ3a-nsjxTLAKRmVdzfeWQGekFAk',
        yandex: '5f2e78df6f6a10ec',
      },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description:
      'Работа курьером, сборщиком, водителем или сменами в сервисах доставки. Помогаем оформиться и выйти на смену. Бесплатно для соискателя.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href={SITE_URL} />
        <link rel="stylesheet" href={`${BASE_PATH}/fonts/fonts.css`} />
      </head>
      <body className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyBar />
        <Metrika />
        <Engagement />
      </body>
    </html>
  );
}
