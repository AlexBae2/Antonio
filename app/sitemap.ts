import type { MetadataRoute } from 'next';
import { IS_GITHUB, SITE_URL } from '@/lib/site';
import { lastCommit } from '@/lib/lastmod';
import { SERVICES } from '@/lib/data/services';
import { ROLES } from '@/lib/data/roles';
import { CITIES } from '@/lib/data/cities';
import { QUESTIONS } from '@/lib/data/questions';
import { getAllPosts } from '@/lib/blog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // Стенд на GitHub Pages не отдаёт sitemap: он закрыт от индексации
  if (IS_GITHUB) return [];

  /*
    lastmod берётся из истории git, а не из времени сборки: см. lib/lastmod.ts.
    Дата страницы - это дата последней правки её шаблона или данных, из которых
    она собрана. Где даты нет (истории нет), тег lastmod просто не выводится.
  */
  const url = (
    path: string,
    priority: number,
    lastModified?: Date,
  ): MetadataRoute.Sitemap[0] => ({
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    priority,
  });

  const SLUG_PAGE = 'app/[slug]/page.tsx';
  const SUB_PAGE = 'app/[slug]/[sub]/page.tsx';

  const services = lastCommit(SLUG_PAGE, 'lib/data/services.ts');
  const roles = lastCommit(SLUG_PAGE, 'lib/data/roles.ts');
  const cities = lastCommit(SLUG_PAGE, 'lib/data/cities.ts');
  const cityService = lastCommit(SUB_PAGE, 'lib/data/cities.ts', 'lib/data/services.ts');
  const questions = lastCommit('app/voprosy/[slug]/page.tsx', 'lib/data/questions.ts');

  return [
    url('/', 1, lastCommit('app/page.tsx', 'lib/data/services.ts', 'lib/data/roles.ts')),
    ...SERVICES.map((s) => url(`/${s.slug}/`, 0.9, services)),
    ...ROLES.map((r) => url(`/${r.slug}/`, 0.8, roles)),
    ...CITIES.map((c) => url(`/${c.slug}/`, 0.8, cities)),
    ...CITIES.flatMap((c) => c.services.map((s) => url(`/${c.slug}/${s}/`, 0.7, cityService))),
    url('/kalkulyator-dohoda/', 0.8, lastCommit('app/kalkulyator-dohoda/page.tsx', 'lib/data/calc.ts')),
    url('/podbor/', 0.7, lastCommit('app/podbor/page.tsx')),
    url('/sravnenie/lavka-ili-eda/', 0.7, lastCommit('app/sravnenie/lavka-ili-eda/page.tsx')),
    url('/sravnenie/kuper-ili-samokat/', 0.7, lastCommit('app/sravnenie/kuper-ili-samokat/page.tsx')),
    // Листинг блога меняется с каждой новой статьёй, поэтому дата - самая свежая из них
    url('/blog/', 0.7, blogIndexDate()),
    ...getAllPosts().map((p) => url(`/blog/${p.slug}/`, 0.6, new Date(p.updatedAt))),
    url('/voprosy/', 0.6, questions),
    ...QUESTIONS.map((q) => url(`/voprosy/${q.slug}/`, 0.5, questions)),
    url('/slovar-terminov/', 0.4, lastCommit('app/slovar-terminov/page.tsx', 'lib/data/glossary.ts')),
    url('/otzyvy/', 0.4, lastCommit('app/otzyvy/page.tsx')),
    url('/o-nas/', 0.4, lastCommit('app/o-nas/page.tsx')),
    url('/metodologiya/', 0.4, lastCommit('app/metodologiya/page.tsx', 'lib/data/tariffFacts.ts')),
  ];
}

function blogIndexDate(): Date | undefined {
  const dates = getAllPosts().map((p) => new Date(p.updatedAt).getTime());
  const template = lastCommit('app/blog/page.tsx');
  if (template) dates.push(template.getTime());
  return dates.length ? new Date(Math.max(...dates)) : undefined;
}
