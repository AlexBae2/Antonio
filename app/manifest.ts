import type { MetadataRoute } from 'next';
import { BASE_PATH, SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Манифест нужен не ради установки на телефон, а ради значка сайта: робот Google
 * берёт иконку из манифеста наравне с <link rel="icon">, а Android использует
 * её при добавлении ярлыка. Пути с BASE_PATH - на стенде сайт лежит в подпапке.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    start_url: `${BASE_PATH}/`,
    display: 'browser',
    background_color: '#faf8f5',
    theme_color: '#201e1b',
    icons: [
      { src: `${BASE_PATH}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${BASE_PATH}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
  };
}
