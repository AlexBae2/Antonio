import { LEGAL } from '@/lib/site';

/**
 * Видимый дисклеймер возле H1/формы каждой сервисной страницы.
 * Требование принципа 1: не только футер.
 */
export default function Disclaimer({ brand }: { brand?: string }) {
  return (
    <p className="rounded-lg border border-line bg-card px-3 py-2 text-xs leading-relaxed text-ink-soft">
      {brand
        ? `Мы независимый кадровый партнёр по подбору персонала для сервиса ${brand}. Мы не являемся ${brand} или его официальным представителем.`
        : LEGAL.disclaimer}
    </p>
  );
}
