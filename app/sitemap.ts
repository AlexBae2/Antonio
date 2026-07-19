import type { MetadataRoute } from 'next';
import { IS_GITHUB, SITE_URL } from '@/lib/site';
import { SERVICES } from '@/lib/data/services';
import { ROLES } from '@/lib/data/roles';
import { CITIES } from '@/lib/data/cities';
import { QUESTIONS } from '@/lib/data/questions';
import { getAllPosts } from '@/lib/blog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // Стенд на GitHub Pages не отдаёт sitemap: он закрыт от индексации
  if (IS_GITHUB) return [];

  const now = new Date();
  const url = (path: string, priority: number, lastModified: Date = now): MetadataRoute.Sitemap[0] => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
  });

  return [
    url('/', 1),
    ...SERVICES.map((s) => url(`/${s.slug}/`, 0.9)),
    ...ROLES.map((r) => url(`/${r.slug}/`, 0.8)),
    ...CITIES.map((c) => url(`/${c.slug}/`, 0.8)),
    ...CITIES.flatMap((c) => c.services.map((s) => url(`/${c.slug}/${s}/`, 0.7))),
    url('/kalkulyator-dohoda/', 0.8),
    url('/podbor/', 0.7),
    url('/sravnenie/lavka-ili-eda/', 0.7),
    url('/sravnenie/kuper-ili-samokat/', 0.7),
    url('/blog/', 0.7),
    ...getAllPosts().map((p) => url(`/blog/${p.slug}/`, 0.6, new Date(p.updatedAt))),
    url('/voprosy/', 0.6),
    ...QUESTIONS.map((q) => url(`/voprosy/${q.slug}/`, 0.5)),
    url('/slovar-terminov/', 0.4),
    url('/otzyvy/', 0.4),
    url('/o-nas/', 0.4),
    url('/metodologiya/', 0.4),
  ];
}
