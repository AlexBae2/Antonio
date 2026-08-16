import { NextRequest, NextResponse } from 'next/server';
import { send } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

/**
 * Проверка канала уведомлений без создания фейковой заявки.
 * Закрыт тем же ADMIN_TOKEN, что и админка: /api/health/notify/?token=...
 * Отвечает, каким путём ушло сообщение (прямо или через прокси).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return NextResponse.json({ ok: false, error: 'бот не настроен: нет токена или chat_id' }, { status: 503 });
  }

  const startedAt = Date.now();
  try {
    const { via } = await send(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      JSON.stringify({
        chat_id: chatId,
        text: 'Проверка канала уведомлений: заявки с сайта дойдут этим путём.',
      }),
    );
    return NextResponse.json({
      ok: true,
      via,
      ms: Date.now() - startedAt,
      proxyConfigured: Boolean(process.env.TELEGRAM_PROXY_URL),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ms: Date.now() - startedAt,
        proxyConfigured: Boolean(process.env.TELEGRAM_PROXY_URL),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
