import type { MetadataRoute } from 'next';
import { IS_GITHUB, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Стенд на GitHub Pages: полный запрет, включая AI-краулеров.
 * Прод: явный allow всем поисковым и AI-краулерам (GEO-стратегия).
 */
export default function robots(): MetadataRoute.Robots {
  if (IS_GITHUB) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const aiCrawlers = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'PerplexityBot',
    'Perplexity-User',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'Google-Extended',
    'Bingbot',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/lp/', '/admin/'] },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: '/' as const })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
