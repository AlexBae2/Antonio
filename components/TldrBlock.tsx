/**
 * Блок «Коротко» над сгибом: прямой ответ для читателя и для извлечения LLM.
 */
export default function TldrBlock({ items, dataDate }: { items: string[]; dataDate?: string }) {
  return (
    <aside className="rounded-2xl border border-line bg-card p-4 shadow-card" aria-label="Коротко о главном">
      <div className="flex items-center gap-2">
        <span className="route-dot" aria-hidden />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide">Коротко</h2>
      </div>
      <ul className="mt-3 space-y-2 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[9px] h-[3px] w-3 shrink-0 rounded bg-amber" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {dataDate && <p className="mt-3 text-xs text-ink-soft">Данные на: {dataDate}</p>}
    </aside>
  );
}
