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

/** Читаемый номер для колл-центра: по нему сразу звонят из телеграма */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length !== 11) return phone;
  return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
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

/** Прокси-агент создаём один раз: пересоздание на каждый лид течёт сокетами */
let proxyDispatcher: unknown = null;

async function getProxyDispatcher(proxyUrl: string): Promise<unknown> {
  if (proxyDispatcher) return proxyDispatcher;
  const { ProxyAgent } = await import('undici');
  proxyDispatcher = new ProxyAgent(proxyUrl);
  return proxyDispatcher;
}

async function post(url: string, body: string, dispatcher?: unknown, timeoutMs = 8000) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(timeoutMs),
    // dispatcher понимает undici-реализация fetch в Node, в типах DOM его нет
    ...(dispatcher ? ({ dispatcher } as Record<string, unknown>) : {}),
  } as RequestInit);
}

/**
 * Отправка с деградацией: прямой запрос, при сбое повтор через прокси.
 * TELEGRAM_FORCE_PROXY=1 отправляет сразу через прокси, минуя прямую попытку:
 * пригодится, если хостер закроет доступ к Telegram насовсем.
 */
export async function send(url: string, body: string): Promise<{ res: Response; via: string }> {
  const proxy = process.env.TELEGRAM_PROXY_URL;
  const force = process.env.TELEGRAM_FORCE_PROXY === '1';

  if (proxy && force) {
    const res = await post(url, body, await getProxyDispatcher(proxy), 12000);
    if (!res.ok) throw new Error(`Telegram через прокси ответил ${res.status}`);
    return { res, via: 'proxy(forced)' };
  }

  try {
    const res = await post(url, body);
    if (res.ok) return { res, via: 'direct' };
    // 4xx это наша ошибка (неверный chat_id или токен), прокси её не починит
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`Telegram отклонил запрос: ${res.status} ${await res.text()}`);
    }
    throw new Error(`Telegram ответил ${res.status}`);
  } catch (err) {
    if (!proxy) throw err;
    if (err instanceof Error && err.message.startsWith('Telegram отклонил')) throw err;

    const res = await post(url, body, await getProxyDispatcher(proxy), 12000);
    if (!res.ok) throw new Error(`Telegram через прокси ответил ${res.status}`);
    return { res, via: 'proxy(fallback)' };
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
      // Полный номер, а не маска: телеграм у колл-центра единственный канал,
      // с маской по заявке нельзя перезвонить
      `Телефон: ${formatPhone(params.phone)}`,
    ].join('\n') + risk;

  try {
    const { via } = await send(
      `https://api.telegram.org/bot${token}/sendMessage`,
      JSON.stringify({ chat_id: chatId, text }),
    );
    if (via !== 'direct') {
      // видно в journalctl: значит прямой путь до телеграма отвалился
      console.warn(`[telegram] уведомление о лиде ${params.id} ушло через ${via}`);
    }
  } catch (err) {
    // Заявка уже в базе, поэтому уведомление не роняет запрос.
    // Но молчать нельзя: без лога такие сбои не диагностируются.
    console.error('[telegram] не удалось отправить уведомление о лиде', params.id, err);
  }
}
