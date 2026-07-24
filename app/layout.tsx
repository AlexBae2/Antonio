import type { Metadata } from 'next';
import { Unbounded, Golos_Text } from 'next/font/google';
import './globals.css';
import { IS_GITHUB, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StickyBar from '@/components/StickyBar';

const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-unbounded',
  display: 'swap',
});

const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-golos',
  display: 'swap',
});

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
    <html lang="ru" className={`${unbounded.variable} ${golos.variable}`}>
      <body className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyBar />
      </body>
    </html>
  );
}
