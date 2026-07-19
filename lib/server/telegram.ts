/**
 * Уведомление колл-центра в Telegram.
 * Телефон в сообщении маскируется (152-ФЗ: полный номер только в админке на РФ-хостинге).
 * Без TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID уведомления просто не шлются (локальная отладка).
 */

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return '***';
  return `+${digits[0]} ${digits.slice(1, 4)} ***-**-${digits.slice(9, 11)}`;
}

export async function notifyLead(params: {
  kind: 'new' | 'partial';
  id: number;
  city: string;
  service: string;
  name: string;
  phone: string;
  riskScore: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const title = params.kind === 'new' ? 'Новая заявка' : 'Недозаполненная заявка (дозвон)';
  const risk = params.riskScore >= 50 ? `\nРиск-скор: ${params.riskScore} (проверить)` : '';
  const text = [
    `${title} #${params.id}`,
    `Город: ${params.city || 'не указан'}`,
    `Сервис: ${params.service || 'не выбран'}`,
    `Имя: ${params.name || 'не указано'}`,
    `Телефон: ${maskPhone(params.phone)} (полный в админке)`,
  ].join('\n') + risk;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // уведомление не должно ронять приём лида
  }
}
