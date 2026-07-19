import { notFound } from 'next/navigation';
import { getDb, type LeadRow } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false }, title: 'Лиды' };

const STATUSES = ['new', 'partial', 'calling', 'qualified', 'activated', 'rejected', 'fraud'] as const;

const STATUS_LABEL: Record<string, string> = {
  new: 'новый',
  partial: 'недозаполнен',
  calling: 'дозвон',
  qualified: 'квалифицирован',
  activated: 'вышел на смену',
  rejected: 'отказ',
  fraud: 'фрод',
};

async function updateStatus(formData: FormData) {
  'use server';
  const token = String(formData.get('token') || '');
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) return;
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) return;
  getDb()
    .prepare(`UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, id);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) notFound();

  const leads = getDb()
    .prepare(`SELECT * FROM leads ORDER BY id DESC LIMIT 200`)
    .all() as unknown as LeadRow[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Лиды (последние 200)</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-line text-left">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Создан</th>
              <th className="py-2 pr-2">Телефон</th>
              <th className="py-2 pr-2">Имя</th>
              <th className="py-2 pr-2">Город</th>
              <th className="py-2 pr-2">Сервис</th>
              <th className="py-2 pr-2">Риск</th>
              <th className="py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className={`border-b border-line ${lead.risk_score >= 50 ? 'bg-amber-soft' : ''}`}>
                <td className="py-2 pr-2">{lead.id}</td>
                <td className="py-2 pr-2 text-xs">{lead.created_at}</td>
                <td className="py-2 pr-2 font-mono">{lead.phone}</td>
                <td className="py-2 pr-2">{lead.name}</td>
                <td className="py-2 pr-2">{lead.city}</td>
                <td className="py-2 pr-2 text-xs">{lead.service}</td>
                <td className="py-2 pr-2">
                  {lead.risk_score}
                  {lead.risk_flags && <span className="block text-xs text-ink-soft">{lead.risk_flags}</span>}
                </td>
                <td className="py-2">
                  <form action={updateStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="token" value={token} />
                    <select name="status" defaultValue={lead.status} className="rounded border border-line bg-card px-1 py-0.5 text-xs">
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded bg-amber px-2 py-0.5 text-xs font-semibold text-white">
                      ок
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
