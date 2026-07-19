const isGithub = process.env.DEPLOY_TARGET === 'github';

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
      }),
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.DEPLOY_TARGET || 'server',
    NEXT_PUBLIC_BASE_PATH: isGithub ? '/Antonio' : '',
  },
};

export default nextConfig;
