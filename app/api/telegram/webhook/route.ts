import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/**
 * Приём входящих сообщений боту @avitos_leads_bot.
 * Бот только шлёт уведомления колл-центру (см. lib/server/telegram.ts) и сам с людьми
 * не переписывается - но раньше история того, кто ему писал, терялась навсегда:
 * Telegram хранит неподтверждённые апдейты (getUpdates) не дольше 24 часов.
 * Этот вебхук просто логирует входящее в базу, ничего не отвечая пользователю.
 *
 * Секрет в заголовке X-Telegram-Bot-Api-Secret-Token: без него сюда мог бы постучаться
 * кто угодно в интернете с фейковым "сообщением". Значение задаётся при регистрации
 * вебхука (setWebhook ... secret_token=...) и должно совпадать с TELEGRAM_WEBHOOK_SECRET.
 */

interface TelegramFrom {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  chat: { id: number };
  from?: TelegramFrom;
  text?: string;
  caption?: string;
}

interface TelegramUpdate {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    // отвечаем 200 в любом случае: Telegram ретраит недоставленные апдейты,
    // а битый JSON он сам себе никогда не пришлёт
    return NextResponse.json({ ok: true });
  }

  const msg = update.message ?? update.edited_message ?? update.channel_post;
  const from = msg?.from;

  if (msg && from) {
    getDb()
      .prepare(
        `INSERT INTO telegram_messages (update_id, chat_id, from_id, username, first_name, last_name, text)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        update.update_id ?? null,
        String(msg.chat.id),
        String(from.id),
        from.username ?? null,
        from.first_name ?? null,
        from.last_name ?? null,
        (msg.text ?? msg.caption ?? '').slice(0, 2000) || null,
      );
  }

  return NextResponse.json({ ok: true });
}
