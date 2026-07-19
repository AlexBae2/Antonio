import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getDb } from '@/lib/server/db';
import { notifyLead } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

const RATE_FULL_PER_DAY = 3;
const RATE_PARTIAL_PER_DAY = 10;

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24);
}

interface LeadBody {
  status?: string;
  city?: string;
  age?: number | null;
  citizenship?: string;
  service?: string;
  phone?: string;
  name?: string;
  company?: string; // honeypot
  startedAt?: number;
  page?: string;
  yclid?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string };
  referrer?: string;
  clientId?: string;
}

export async function POST(req: NextRequest) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const isPartial = body.status === 'partial';
  const phone = String(body.phone || '').replace(/[^+\d]/g, '');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) {
    return NextResponse.json({ error: 'Укажите телефон полностью' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipHash = hashIp(ip);
  const db = getDb();

  // Антифрод: скоринг вместо молчаливого дропа
  const flags: string[] = [];
  let risk = 0;

  if (body.company) {
    flags.push('honeypot');
    risk += 60;
  }
  const fillMs = body.startedAt ? Date.now() - Number(body.startedAt) : null;
  if (fillMs !== null && fillMs >= 0 && fillMs < 3000) {
    flags.push('too_fast');
    risk += 40;
  }
  if (body.yclid && !body.referrer) {
    flags.push('yclid_no_referrer');
    risk += 15;
  }

  // rate limit по хэшу IP за 24 часа: мягкая блокировка с сообщением
  const countRow = db
    .prepare(
      `SELECT
        SUM(CASE WHEN status != 'partial' THEN 1 ELSE 0 END) AS full_cnt,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_cnt
       FROM leads WHERE ip_hash = ? AND created_at > datetime('now', '-1 day')`,
    )
    .get(ipHash) as { full_cnt: number | null; partial_cnt: number | null };

  if (!isPartial && (countRow.full_cnt ?? 0) >= RATE_FULL_PER_DAY) {
    return NextResponse.json(
      { error: 'Слишком много заявок с этого адреса за сутки. Позвоните нам напрямую.' },
      { status: 429 },
    );
  }
  if (isPartial && (countRow.partial_cnt ?? 0) >= RATE_PARTIAL_PER_DAY) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  // дедуп: если полный лид с этим телефоном уже есть за 30 дней - обновляем карточку, не плодим
  const existing = db
    .prepare(
      `SELECT id, status FROM leads
       WHERE phone = ? AND status != 'partial' AND created_at > datetime('now', '-30 day')
       ORDER BY id DESC LIMIT 1`,
    )
    .get(digits) as { id: number; status: string } | undefined;

  if (!isPartial && existing) {
    db.prepare(
      `UPDATE leads SET updated_at = datetime('now'),
        service = COALESCE(NULLIF(?, ''), service),
        city = COALESCE(NULLIF(?, ''), city)
       WHERE id = ?`,
    ).run(String(body.service || ''), String(body.city || ''), existing.id);
    return NextResponse.json({ ok: true, deduped: true });
  }

  // partial-лид: обновляем, если по этому телефону уже есть partial за сутки
  if (isPartial) {
    const partialExisting = db
      .prepare(
        `SELECT id FROM leads WHERE phone = ? AND status = 'partial' AND created_at > datetime('now', '-1 day') LIMIT 1`,
      )
      .get(digits) as { id: number } | undefined;
    if (partialExisting) return NextResponse.json({ ok: true });
  }

  const result = db
    .prepare(
      `INSERT INTO leads (status, phone, name, city, age, citizenship, service, page, yclid,
        utm_source, utm_medium, utm_campaign, utm_content, referrer, client_id, ip_hash, risk_score, risk_flags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      isPartial ? 'partial' : 'new',
      digits,
      String(body.name || '').slice(0, 100),
      String(body.city || '').slice(0, 100),
      body.age ? Number(body.age) : null,
      String(body.citizenship || '').slice(0, 50),
      String(body.service || '').slice(0, 100),
      String(body.page || '').slice(0, 200),
      String(body.yclid || '').slice(0, 100),
      String(body.utm?.source || '').slice(0, 100),
      String(body.utm?.medium || '').slice(0, 100),
      String(body.utm?.campaign || '').slice(0, 100),
      String(body.utm?.content || '').slice(0, 100),
      String(body.referrer || '').slice(0, 300),
      String(body.clientId || '').slice(0, 50),
      ipHash,
      risk,
      flags.join(',') || null,
    );

  // высокорисковые (honeypot) не беспокоят колл-центр, но сохраняются для разбора
  if (risk < 60) {
    await notifyLead({
      kind: isPartial ? 'partial' : 'new',
      id: Number(result.lastInsertRowid),
      city: String(body.city || ''),
      service: String(body.service || ''),
      name: String(body.name || ''),
      phone: digits,
      riskScore: risk,
    });
  }

  return NextResponse.json({ ok: true });
}
