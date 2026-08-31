/**
 * Проверка очереди блога перед коммитом: node scripts/check-blog.mjs
 *
 * Статьи с будущим publishAt в обычную сборку не попадают (lib/blog.ts их
 * отфильтровывает), поэтому ошибка во фронтматтере или битая ссылка всплыли бы
 * только в день выхода — когда ребилд уже опубликовал материал. Этот скрипт
 * ловит такое заранее и падает с кодом 1.
 *
 * Рендер MDX он не проверяет: для этого надо временно сдвинуть publishAt
 * в прошлое и прогнать npm run build:github.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BLOG_DIR = path.join(root, 'content', 'blog');
const REQUIRED = ['title', 'description', 'h1', 'publishAt', 'updatedAt', 'targetQuery', 'category', 'author'];

const errors = [];
const fail = (slug, msg) => errors.push(`${slug}: ${msg}`);

/** слаги из lib/data/*.ts — там они все объявлены как `slug: '...'` */
function dataSlugs(file) {
  const src = fs.readFileSync(path.join(root, 'lib', 'data', file), 'utf8');
  return [...src.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
}

const posts = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) {
      fail(slug, 'не разобрался фронтматтер (нужны две строки ---)');
      return null;
    }
    const meta = Object.fromEntries([...m[1].matchAll(/^(\w+):\s*"(.*)"$/gm)].map((x) => [x[1], x[2]]));
    return { slug, meta, body: m[2] };
  })
  .filter(Boolean);

const bySlug = new Map(posts.map((p) => [p.slug, p]));

// маршруты, на которые вообще можно ссылаться
const routes = new Set([
  '/', '/kalkulyator-dohoda/', '/podbor/', '/blog/', '/voprosy/', '/slovar-terminov/',
  '/otzyvy/', '/o-nas/', '/metodologiya/', '/rekvizity/', '/policy/',
  '/sravnenie/lavka-ili-eda/', '/sravnenie/kuper-ili-samokat/',
]);
for (const s of [...dataSlugs('services.ts'), ...dataSlugs('roles.ts'), ...dataSlugs('cities.ts')]) {
  routes.add(`/${s}/`);
}
for (const s of dataSlugs('questions.ts')) routes.add(`/voprosy/${s}/`);
for (const p of posts) routes.add(`/blog/${p.slug}/`);

for (const { slug, meta, body } of posts) {
  for (const key of REQUIRED) {
    if (!meta[key]) fail(slug, `нет поля ${key}`);
  }
  // dateModified раньше datePublished в Article JSON-LD — разметка противоречит себе
  if (meta.publishAt && meta.updatedAt && meta.updatedAt < meta.publishAt) {
    fail(slug, `updatedAt (${meta.updatedAt}) раньше publishAt (${meta.publishAt})`);
  }
  for (const [, href] of body.matchAll(/\]\((\/[^)]*)\)/g)) {
    if (!routes.has(href)) {
      fail(slug, `ссылка на несуществующий маршрут: ${href}`);
      continue;
    }
    // dynamicParams=false: страницы ещё не вышедшей статьи нет, ссылка даст 404
    const target = href.match(/^\/blog\/([^/]+)\/$/);
    if (target && bySlug.get(target[1])?.meta.publishAt > meta.publishAt) {
      fail(slug, `ссылка на статью, которая выйдет позже: ${href}`);
    }
  }
}

const queued = posts
  .filter((p) => new Date(`${p.meta.publishAt}T00:00:00+03:00`).getTime() > Date.now())
  .sort((a, b) => (a.meta.publishAt < b.meta.publishAt ? -1 : 1));

console.log(`Статей всего: ${posts.length}, в очереди: ${queued.length}`);
for (const p of queued) console.log(`  ${p.meta.publishAt}  ${p.slug}`);

if (errors.length) {
  console.error(`\nОшибок: ${errors.length}`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('\nОчередь в порядке.');
