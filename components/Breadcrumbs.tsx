import Link from 'next/link';
import JsonLd from './JsonLd';
import { absUrl } from '@/lib/site';

export interface Crumb {
  href: string;
  label: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: '/', label: 'Главная' }, ...items];
  return (
    <nav aria-label="Хлебные крошки" className="text-xs text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>→</span>}
            {i === all.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="underline decoration-line underline-offset-2 hover:text-ink">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((crumb, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: crumb.label,
            item: absUrl(crumb.href),
          })),
        }}
      />
    </nav>
  );
}
