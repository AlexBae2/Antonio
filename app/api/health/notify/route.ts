import { NextRequest, NextResponse } from 'next/server';
import { adminChatId, chatIds, send } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

/**
 * Проверка канала уведомлений без создания фейковой заявки.
 * Закрыт тем же ADMIN_TOKEN, что и админка: /api/health/notify/?token=...
 * Отвечает по каждому получателю, каким путём ушло сообщение (прямо или через прокси).
 *
 * По умолчанию пишет только админу (TELEGRAM_ADMIN_CHAT_ID): дёргать проверкой весь
 * колл-центр незачем. `&all=1` проверяет всех получателей заявок разом: так видно,
 * если кто-то заблокировал бота и лиды до него молча не доходят.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const admin = adminChatId();
  const all = req.nextUrl.searchParams.get('all') === '1';
  const recipients = all || !admin ? chatIds() : [admin];
  if (!botToken || recipients.length === 0) {
    return NextResponse.json({ ok: false, error: 'бот не настроен: нет токена или chat_id' }, { status: 503 });
  }

  const startedAt = Date.now();
  const results = await Promise.all(
    recipients.map(async (chatId) => {
      const at = Date.now();
      try {
        const { via } = await send(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          JSON.stringify({
            chat_id: chatId,
            text: 'Проверка канала уведомлений: заявки с сайта дойдут этим путём.',
          }),
        );
        return { chatId, ok: true, via, ms: Date.now() - at };
      } catch (err) {
        return { chatId, ok: false, ms: Date.now() - at, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );

  // Один недоступный получатель это уже поломка канала: заявку увидят не все
  const ok = results.every((r) => r.ok);
  return NextResponse.json(
    {
      ok,
      ms: Date.now() - startedAt,
      proxyConfigured: Boolean(process.env.TELEGRAM_PROXY_URL),
      recipients: results,
    },
    { status: ok ? 200 : 502 },
  );
}
