const isGithub = process.env.DEPLOY_TARGET === 'github';

/** Сервисы, снятые с сайта 28.10.2026: их страницы и связки с городами уходят на главную */
const REMOVED_SERVICES = 'kurier-zakazy-iz-magazinov|kurier-express-dostavka|kurier-zdorovoe-pitanie|kurier-produktovye-seti|kurier-posylki-i-gruzy|voditel-taksi|kurier-dostavka-supermarket';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  ...(isGithub
    ? {
        output: 'export',
        basePath: '/Antonio',
        images: { unoptimized: true },
      }
    : {
        output: 'standalone',
        async redirects() {
          return [
            { source: `/:slug(${REMOVED_SERVICES})`, destination: '/', permanent: true },
            { source: `/:city/:slug(${REMOVED_SERVICES})`, destination: '/', permanent: true },
            { source: '/sravnenie/kuper-ili-samokat', destination: '/', permanent: true },
          ];
        },
      }),
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.DEPLOY_TARGET || 'server',
    NEXT_PUBLIC_BASE_PATH: isGithub ? '/Antonio' : '',
  },
};

export default nextConfig;
