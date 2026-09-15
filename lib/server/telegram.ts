/**
 * Уведомление колл-центра в Telegram.
 * Телефон в сообщении маскируется (152-ФЗ: полный номер только в админке на РФ-хостинге).
 * Без TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID уведомления просто не шлются (локальная отладка).
 * В TELEGRAM_CHAT_ID можно перечислить несколько получателей через запятую.
 * TELEGRAM_ADMIN_CHAT_ID это отдельный канал для служебных сообщений (сбои доставки,
 * проверки), которые колл-центру видеть незачем.
 *
 * Отправка идёт напрямую, а при сетевой ошибке повторяется через прокси из
 * TELEGRAM_PROXY_URL, если он задан: на случай, если у хостера закроют доступ
 * к api.telegram.org. Заявка при любом исходе уже сохранена в базе, уведомление
 * упасть её не может.
 *
 * Сверх этого каждая отправка повторяется до трёх раз. Путь до телеграма с этого VPS
 * залипает именно на холодном коннекте: первый SYN пропадает и висит до таймаута,
 * а следующий запрос по прогретому пути отвечает за 40-100 мс. Одной попытки поэтому
 * мало, и таймаут держим коротким - быстрее повторить, чем ждать зависший сокет.
 */

/**
 * Получатели уведомлений. TELEGRAM_CHAT_ID может содержать несколько id через запятую:
 * заявку видят и колл-центр, и владелец сайта, каждый у себя в личке, без общего чата.
 * Чтобы бот мог написать человеку первым, тот должен сам нажать Start у бота.
 */
export function chatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Админ (он же дежурный по отладке): сюда идёт то, что не нужно колл-центру */
export function adminChatId(): string | null {
  return process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || null;
}

/**
 * Служебное сообщение только админу. Ничего не бросает: это диагностика,
 * из-за неё не должен падать ни лид, ни health-check.
 */
export async function notifyAdmin(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const admin = adminChatId();
  if (!token || !admin) return;

  try {
    await send(
      `https://api.telegram.org/bot${token}/sendMessage`,
      JSON.stringify({ chat_id: admin, text }),
    );
  } catch (err) {
    console.error('[telegram] служебное сообщение админу не ушло', err);
  }
}

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

async function post(url: string, body: string, dispatcher?: unknown, timeoutMs = 5000) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(timeoutMs),
    // dispatcher понимает undici-реализация fetch в Node, в типах DOM его нет
    ...(dispatcher ? ({ dispatcher } as Record<string, unknown>) : {}),
  } as RequestInit);
}

/** Сколько раз пробуем отправить одно сообщение, прежде чем считать его потерянным */
export const SEND_ATTEMPTS = 3;

/** Паузы перед 2-й и 3-й попытками: пути до телеграма нужно время, чтобы подняться */
const RETRY_PAUSE_MS = [800, 2000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Неверный chat_id или токен повтором не лечится, такое отдаём сразу */
function isFatal(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('Telegram отклонил');
}

/**
 * Одна попытка с деградацией: прямой запрос, при сбое повтор через прокси.
 * TELEGRAM_FORCE_PROXY=1 отправляет сразу через прокси, минуя прямую попытку:
 * пригодится, если хостер закроет доступ к Telegram насовсем.
 */
async function sendOnce(url: string, body: string): Promise<{ res: Response; via: string }> {
  const proxy = process.env.TELEGRAM_PROXY_URL;
  const force = process.env.TELEGRAM_FORCE_PROXY === '1';

  if (proxy && force) {
    const res = await post(url, body, await getProxyDispatcher(proxy), 10000);
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
    if (isFatal(err)) throw err;

    const res = await post(url, body, await getProxyDispatcher(proxy), 10000);
    if (!res.ok) throw new Error(`Telegram через прокси ответил ${res.status}`);
    return { res, via: 'proxy(fallback)' };
  }
}

/** Отправка с повторами. Наружу отдаём номер удачной попытки: по нему видно, что путь залипал. */
export async function send(
  url: string,
  body: string,
): Promise<{ res: Response; via: string; attempt: number }> {
  let last: unknown;

  for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
    try {
      return { ...(await sendOnce(url, body)), attempt };
    } catch (err) {
      if (isFatal(err)) throw err;
      last = err;
      if (attempt < SEND_ATTEMPTS) await sleep(RETRY_PAUSE_MS[attempt - 1]);
    }
  }

  throw last;
}

/** Время из sqlite (UTC, 'YYYY-MM-DD HH:MM:SS') в привычное для админа МСК */
function formatMsk(sqliteUtc: string): string {
  const d = new Date(sqliteUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return sqliteUtc;
  const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(msk.getUTCDate())}.${p(msk.getUTCMonth() + 1)}.${msk.getUTCFullYear()} ${p(msk.getUTCHours())}:${p(msk.getUTCMinutes())} МСК`;
}

export function repeatLeadText(params: {
  id: number;
  name: string;
  city: string;
  service: string;
  phone: string;
  firstAt: string;
}): string {
  return [
    `🔁 Повторная заявка #${params.id}`,
    `Город: ${params.city || 'не указан'}`,
    `Сервис: ${SERVICE_NAMES[params.service] || params.service || 'не выбран'}`,
    `Имя: ${params.name || 'не указано'}`,
    `Телефон: ${formatPhone(params.phone)}`,
    `Первый раз: ${formatMsk(params.firstAt)}`,
  ].join('\n');
}

/**
 * Повторная заявка с того же телефона (дедуп в /api/lead). Колл-центру она не нужна:
 * карточка у них уже есть. Но и молчать нельзя: форма показала 'принято', цель в Метрике
 * сработала, а в телеграме тишина - дважды это принимали за отвалившийся канал.
 */
export function notifyRepeatLead(params: Parameters<typeof repeatLeadText>[0]): Promise<void> {
  return notifyAdmin(repeatLeadText(params));
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
  const recipients = chatIds();
  if (!token || recipients.length === 0) return;

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

  // Каждому получателю отдельным запросом: если один заблокировал бота или у него
  // неверный id, остальные всё равно получат заявку
  await Promise.all(
    recipients.map(async (chatId) => {
      try {
        const { via, attempt } = await send(
          `https://api.telegram.org/bot${token}/sendMessage`,
          JSON.stringify({ chat_id: chatId, text }),
        );
        if (via !== 'direct' || attempt > 1) {
          // видно в journalctl: значит с первого раза и напрямую не ушло
          console.warn(
            `[telegram] уведомление о лиде ${params.id} ушло в ${chatId} через ${via}, попытка ${attempt}`,
          );
        }
      } catch (err) {
        // Заявка уже в базе, поэтому уведомление не роняет запрос.
        // Но молчать нельзя: без лога такие сбои не диагностируются.
        console.error('[telegram] лид', params.id, 'не доехал до', chatId, err);
        // В журнал никто не смотрит, пока не хватятся лида. Админу пишем сразу,
        // остальным получателям такое знать незачем
        await notifyAdmin(
          `❗️Заявка #${params.id} не доехала до ${chatId} за ${SEND_ATTEMPTS} попытки: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),
  );
}
