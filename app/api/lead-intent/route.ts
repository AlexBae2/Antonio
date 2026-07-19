import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/**
 * Фиксация клика по tel:/мессенджер-CTA (sendBeacon).
 * Без этого мессенджер-канал невидим для аналитики и офлайн-конверсий.
 */
export async function POST(req: NextRequest) {
  let body: { kind?: string; page?: string; clientId?: string; yclid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const kind = String(body.kind || '').slice(0, 20);
  if (!['tel', 'telegram', 'whatsapp'].includes(kind)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  getDb()
    .prepare(`INSERT INTO cta_intents (kind, page, client_id, yclid) VALUES (?, ?, ?, ?)`)
    .run(kind, String(body.page || '').slice(0, 200), String(body.clientId || '').slice(0, 50), String(body.yclid || '').slice(0, 100));
  return NextResponse.json({ ok: true });
}
