import { execFileSync } from 'node:child_process';

/**
 * Дата последнего коммита, тронувшего любой из перечисленных файлов.
 *
 * Зачем это вообще: в sitemap нельзя писать в lastmod время сборки. Сайт
 * пересобирается каждую ночь ради автопостинга блога, и робот каждый раз видел
 * бы все 64 страницы изменёнными. Яндекс и Google на такое отвечают одинаково -
 * перестают доверять lastmod и начинают его игнорировать. Честнее не отдать
 * дату вовсе, чем отдать неправду.
 *
 * Прод собирается внутри git-клона (scripts/server/03-app-deploy.sh: git pull,
 * затем build), поэтому история на месте. Если её нет - например, shallow clone
 * на CI - возвращаем undefined, и страница уходит в sitemap без lastmod.
 */
const cache = new Map<string, Date | undefined>();

export function lastCommit(...files: string[]): Date | undefined {
  const key = files.join('\n');
  if (cache.has(key)) return cache.get(key);

  let result: Date | undefined;
  try {
    // -1 по нескольким путям сразу отдаёт самый свежий из коммитов, тронувших
    // хотя бы один файл: ровно то, что нужно для страницы из данных и шаблона
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const date = new Date(iso);
    if (iso && !Number.isNaN(date.getTime())) result = date;
  } catch {
    // git недоступен или это не репозиторий - работаем без дат
  }

  cache.set(key, result);
  return result;
}
