/**
 * Уведомление колл-центра в Telegram.
 * Телефон в сообщении маскируется (152-ФЗ: полный номер только в админке на РФ-хостинге).
 * Без TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID уведомления просто не шлются (локальная отладка).
 *
 * Отправка идёт напрямую, а при сетевой ошибке повторяется через прокси из
 * TELEGRAM_PROXY_URL, если он задан: на случай, если у хостера закроют доступ
 * к api.telegram.org. Заявка при любом исходе уже сохранена в базе, уведомление
 * упасть её не может.
 */

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return '***';
  return `+${digits[0]} ${digits.slice(1, 4)} ***-**-${digits.slice(9, 11)}`;
}

const SERVICE_NAMES: Record<string, string> = {
  'kurier-dostavka-edy': 'Яндекс Еда',
  'kurier-produkty-darkstore': 'Яндекс Лавка',
  'kurier-zakazy-iz-magazinov': 'Купер',
  'kurier-express-dostavka': 'Самокат',
  'sborshchik-marketpleys': 'Яндекс Маркет',
  'kurier-zdorovoe-pitanie': 'ВкусВилл',
  'kurier-produktovye-seti': 'X5',
  'smennaya-podrabotka': 'Яндекс Смена',
  'kurier-posylki-i-gruzy': 'Яндекс Доставка',
  'voditel-taksi': 'Яндекс Такси',
  'kurier-dostavka-supermarket': 'Магнит',
};

async function send(url: string, body: string): Promise<Response> {
  const direct = () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(8000),
    });

  try {
    const res = await direct();
    if (res.ok) return res;
    throw new Error(`Telegram ответил ${res.status}`);
  } catch (err) {
    const proxy = process.env.TELEGRAM_PROXY_URL;
    if (!proxy) throw err;

    // ProxyAgent грузим динамически: без прокси зависимость не нужна
    const { ProxyAgent } = await import('undici');
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(12000),
      // @ts-expect-error dispatcher поддерживается undici-реализацией fetch в Node
      dispatcher: new ProxyAgent(proxy),
    });
  }
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

  const title = params.kind === 'new' ? '🟢 Новая заявка' : '🟡 Недозаполненная заявка (дозвонить)';
  const risk = params.riskScore >= 50 ? `\n⚠️ Риск-скор: ${params.riskScore}, проверить` : '';
  const service = SERVICE_NAMES[params.service] || params.service || 'не выбран';
  const text =
    [
      `${title} #${params.id}`,
      `Город: ${params.city || 'не указан'}`,
      `Сервис: ${service}`,
      `Имя: ${params.name || 'не указано'}`,
      `Телефон: ${maskPhone(params.phone)}`,
      'Полный номер и статусы: /admin на сайте',
    ].join('\n') + risk;

  try {
    await send(
      `https://api.telegram.org/bot${token}/sendMessage`,
      JSON.stringify({ chat_id: chatId, text }),
    );
  } catch (err) {
    // Заявка уже в базе, поэтому уведомление не роняет запрос.
    // Но молчать нельзя: без лога такие сбои не диагностируются.
    console.error('[telegram] не удалось отправить уведомление о лиде', params.id, err);
  }
}
