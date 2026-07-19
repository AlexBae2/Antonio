import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  h1: string;
  publishAt: string;
  updatedAt: string;
  targetQuery: string;
  category: string;
  author: string;
}

export interface Post extends PostMeta {
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Автопостинг: статья видна, только когда publishAt наступил на момент сборки.
 * Ежедневный ребилд (GH Action cron / systemd-таймер) публикует очередь сам.
 * Дата без времени трактуется как полночь по Москве, а не UTC.
 */
function isPublished(publishAt: string): boolean {
  const raw = publishAt.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const ts = new Date(dateOnly ? `${raw}T00:00:00+03:00` : raw).getTime();
  return !Number.isNaN(ts) && ts <= Date.now();
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      // YAML-даты без кавычек gray-matter отдаёт объектами Date - нормализуем в YYYY-MM-DD
      const asDateString = (v: unknown): string => {
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return String(v || '');
      };
      return {
        slug: file.replace(/\.mdx$/, ''),
        title: String(data.title || ''),
        description: String(data.description || ''),
        h1: String(data.h1 || data.title || ''),
        publishAt: asDateString(data.publishAt),
        updatedAt: asDateString(data.updatedAt || data.publishAt),
        targetQuery: String(data.targetQuery || ''),
        category: String(data.category || 'Гайды'),
        author: String(data.author || 'redakcia'),
        content,
      };
    })
    .filter((p) => p.title && p.publishAt && isPublished(p.publishAt))
    .sort((a, b) => (a.publishAt < b.publishAt ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
