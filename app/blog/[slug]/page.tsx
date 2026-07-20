import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import { getAllPosts, getPost } from '@/lib/blog';
import { absUrl, SITE_NAME } from '@/lib/site';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: absUrl(`/blog/${slug}/`) },
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const mdxComponents = {
  table: (props: React.ComponentProps<'table'>) => (
    <div className="my-5 overflow-x-auto">
      <table {...props} className="w-full min-w-[480px] border-collapse text-sm" />
    </div>
  ),
  th: (props: React.ComponentProps<'th'>) => (
    <th {...props} className="border-b-2 border-line py-2 pr-3 text-left font-semibold" />
  ),
  td: (props: React.ComponentProps<'td'>) => (
    <td {...props} className="border-b border-line py-2 pr-3 align-top leading-relaxed" />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 {...props} className="mt-8 font-display text-2xl font-semibold" />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 {...props} className="mt-6 text-lg font-semibold" />
  ),
  p: (props: React.ComponentProps<'p'>) => <p {...props} className="mt-4 leading-relaxed" />,
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul {...props} className="mt-4 list-disc space-y-2 pl-5 leading-relaxed" />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol {...props} className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed" />
  ),
  a: ({ href, ...props }: React.ComponentProps<'a'>) => {
    const cls = 'underline decoration-amber underline-offset-4 hover:text-amber-deep';
    // внутренние ссылки через Link: иначе на стенде потеряется basePath
    if (href && href.startsWith('/')) {
      return <Link {...props} href={href} className={cls} />;
    }
    return <a {...props} href={href} className={cls} />;
  },
};

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: '/blog/', label: 'Блог' },
          { href: `/blog/${post.slug}/`, label: post.h1 },
        ]}
      />
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
            <span className="rounded-full bg-amber-soft px-2 py-0.5 font-semibold text-amber-deep">
              {post.category}
            </span>
            <time dateTime={post.publishAt}>{fmtDate(post.publishAt)}</time>
            {post.updatedAt !== post.publishAt && (
              <span>обновлено: {fmtDate(post.updatedAt)}</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">{post.h1}</h1>
          <div className="mt-2">
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>
          <p className="mt-8 rounded-2xl border border-line bg-card p-4 text-sm text-ink-soft">
            Материал подготовлен редакцией {SITE_NAME} по открытым данным сервисов. Мы независимый
            кадровый партнёр: помогаем устроиться, для соискателя бесплатно.{' '}
            <Link href="/metodologiya/" className="underline">
              Откуда цифры
            </Link>
          </p>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <LeadForm />
        </aside>
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.h1,
          description: post.description,
          datePublished: post.publishAt,
          dateModified: post.updatedAt,
          author: { '@type': 'Organization', name: `Редакция ${SITE_NAME}` },
          publisher: { '@type': 'Organization', name: SITE_NAME },
          mainEntityOfPage: absUrl(`/blog/${post.slug}/`),
        }}
      />
    </article>
  );
}
