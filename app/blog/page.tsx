import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAllPosts } from '@/lib/blog';
import { absUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Блог о работе в доставке: доход, оформление, честные разборы',
  description:
    'Гайды для курьеров и сборщиков: сколько платят сервисы, со скольки лет берут, как оформить самозанятость и не наступить на грабли новичка.',
  alternates: { canonical: absUrl('/blog/') },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ href: '/blog/', label: 'Блог' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Блог о работе в доставке</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        Разбираем работу курьером и сборщиком по фактам: официальные тарифы сервисов, оформление,
        честные плюсы и минусы. Без обещаний золотых гор.
      </p>
      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="rounded-2xl border border-line bg-card p-6 text-ink-soft">
            Первые статьи уже в работе: заходите через пару дней.
          </p>
        )}
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="group block rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
          >
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <span className="rounded-full bg-amber-soft px-2 py-0.5 font-semibold text-amber-deep">
                {post.category}
              </span>
              <time dateTime={post.publishAt}>{fmtDate(post.publishAt)}</time>
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-amber-deep">
              {post.h1}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
