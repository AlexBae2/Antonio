# Продакшен-плейбук: VPS под courier-jobs-site (Ubuntu 24.04, Timeweb Cloud)

Три идемпотентных bash-скрипта, которые вместе поднимают прод-сервер для
Next.js-сайта лидгена (форма заявок + SQLite) с нуля, либо безопасно
довыполняются на уже настроенном сервере.

| Скрипт | Что делает |
|---|---|
| `01-harden.sh` | SSH hardening, ufw, fail2ban, unattended-upgrades, sysctl |
| `02-nginx-ssl.sh` | nginx reverse proxy, HTTP/2, gzip+brotli, security-заголовки, rate limit на `/api/lead`, Let's Encrypt |
| `03-app-deploy.sh` | Node 22 + pm2, деплой из git, systemd-таймер ежедневного ребилда, бэкапы SQLite |

Все три скрипта можно перезапускать сколько угодно раз — конфиги
перезаписываются детерминированно, уже сделанные шаги (пользователь, сертификат,
pm2-автозапуск) пропускаются, а не дублируются.

## Порядок запуска

Готовим переменные один раз (замените под себя):

```bash
export SSH_PORT=2202
export DEPLOY_USER=deploy
export DOMAIN=smenaru.ru
export CERTBOT_EMAIL=you@example.com
export REPO=https://github.com/AlexBae2/Antonio.git
export APP_PORT=3000     # должен совпадать в 02 и 03
```

### 1. Хардeнинг (от root, по SSH на текущем порту 22)

```bash
sudo -E bash 01-harden.sh
```

**СТОП. Перед тем как закрывать текущую SSH-сессию:**

1. Откройте **новое** окно терминала.
2. Проверьте вход новым пользователем на новом порту:
   ```bash
   ssh -p 2202 deploy@<IP сервера>
   sudo whoami   # должно быть root, без запроса пароля
   ```
3. Только после успешного входа закройте старую сессию (root по порту 22).
4. Если у вас `SSH_PORT != 22`, закройте временное правило для 22:
   ```bash
   sudo ufw delete allow 22/tcp
   ```

Если вход не удался — **не закрывайте старую сессию**, там ещё жив root по
порту 22, через неё чините `/etc/ssh/sshd_config.d/00-hardening.conf`.

### 2. nginx + SSL (от `deploy`, через sudo, уже на новом порту)

Убедитесь, что A-записи `smenaru.ru` и `www.smenaru.ru` уже указывают на IP
сервера (без этого certbot не выпустит сертификат — проверить: `dig +short
smenaru.ru`).

```bash
sudo -E bash 02-nginx-ssl.sh
```

На этом шаге сайт ещё ответит 502 (nginx поднят, приложения ещё нет) — это
нормально, дальше третий скрипт.

### 3. Деплой приложения

```bash
sudo -E bash 03-app-deploy.sh
```

Дальнейшие редеплои (после `git push` в основную ветку):

```bash
sudo /usr/local/sbin/deploy-smenaru.ru.sh
```

(путь = `/usr/local/sbin/deploy-$DOMAIN.sh`, скрипт сам копирует себя туда при
первом запуске и с этого момента им же пользуется systemd-таймер ежедневного
ребилда).

## Переменные скриптов

<details>
<summary>01-harden.sh</summary>

| Переменная | По умолчанию | Что это |
|---|---|---|
| `SSH_PORT` | `2202` | новый порт sshd |
| `DEPLOY_USER` | `deploy` | sudo-пользователь |
| `DEPLOY_USER_SSH_KEY` | пусто | публичный ключ; пусто = скопировать текущий `root/.ssh/authorized_keys` |
| `AUTO_CONFIRM` | `false` | `true` — не спрашивать подтверждение перед рестартом sshd |
| `F2B_BANTIME` / `F2B_FINDTIME` / `F2B_MAXRETRY` | `1h` / `10m` / `5` | параметры fail2ban |
| `AUTO_REBOOT` / `AUTO_REBOOT_TIME` | `true` / `04:30` | авто-ребут после апдейтов ядра |

</details>

<details>
<summary>02-nginx-ssl.sh</summary>

| Переменная | По умолчанию | Что это |
|---|---|---|
| `DOMAIN` | `smenaru.ru` | основной домен (www добавляется автоматически) |
| `APP_PORT` | `3000` | куда проксируем, должен совпадать с 03 |
| `CERTBOT_EMAIL` | `admin@$DOMAIN` | для писем об истечении сертификата |

</details>

<details>
<summary>03-app-deploy.sh</summary>

| Переменная | По умолчанию | Что это |
|---|---|---|
| `REPO` | placeholder | git-репозиторий сайта |
| `DOMAIN` | `smenaru.ru` | для имени сервиса/лога |
| `APP_USER` | `webapp` | отдельный системный пользователь для запуска pm2 (не sudo) |
| `DEPLOY_USER` | `deploy` | добавляется в группу `webapp` для удобных `pm2 logs` |
| `APP_DIR` | `/home/webapp/app` | куда клонируется репозиторий |
| `APP_PORT` | `3000` | порт, на котором слушает `next start`/standalone-сервер (`127.0.0.1` only) |
| `NODE_MAJOR` | `22` | мажорная версия Node (LTS) |
| `PM2_MAX_MEMORY` | `400M` | `max_memory_restart` в pm2 |
| `APP_NODE_OPTIONS` | `--experimental-sqlite` | см. ниже про `node:sqlite` |
| `BACKUP_DIR` / `BACKUP_RETENTION_DAYS` | `/var/backups/leads-db` / `14` | бэкапы SQLite |
| `REBUILD_CRON_TIME_UTC` | `03:30:00` | время ежедневного ребилда (совпадает с cron GH Pages) |

</details>

## Важные нюансы, зашитые в скрипты

- **`node:sqlite` и Node 22 vs Node 24.** `lib/server/db.ts` использует
  встроенный `node:sqlite` (`DatabaseSync`). На Node 22.x эта штука до сих пор
  требует флаг `--experimental-sqlite` — без него pm2 упадёт при первом
  запросе к `/api/lead`. Если разработка велась на машине с Node 24+ (там флаг
  не нужен), это легко не заметить локально и словить сюрприз в проде.
  `03-app-deploy.sh` включает флаг через `NODE_OPTIONS` в ecosystem-файле по
  умолчанию — трогать не нужно, если только вы не проверили, что конкретная
  версия Node на сервере больше не требует флаг.
- **Порядок имени sshd-дроп-ина.** Файл называется `00-hardening.conf`, а не
  `99-...`, специально: у sshd побеждает первое встреченное значение
  директивы, а облачные образы Ubuntu иногда кладут свой дроп-ин (например
  `50-cloud-init.conf`) с `PasswordAuthentication yes`. `00-` гарантированно
  идёт раньше по алфавиту.
- **`data/leads.db` живёт вне `.next`.** `build:server` делает `rm -rf .next`
  перед каждой сборкой — база в `data/` (вне `.next`) это переживает.
  `03-app-deploy.sh` запускает `pm2` с `cwd=$APP_DIR` (не `cwd=.next/standalone`),
  поэтому `process.cwd()`-based пути в коде (`lib/server/db.ts`, `lib/blog.ts`)
  видят настоящие `data/` и `content/` из корня репозитория.
- **Приложение слушает только `127.0.0.1`.** `HOSTNAME=127.0.0.1` в pm2 +
  ufw не открывает `APP_PORT` наружу вообще — единственный путь до
  приложения снаружи это nginx на 80/443.
- **CSP отдаётся как `Content-Security-Policy-Report-Only`** — это
  сознательно "заготовка": сначала смотрите в DevTools/отчётах, что реально
  ловится, потом меняете заголовок на принудительный `Content-Security-Policy`
  в `/etc/nginx/snippets/security-headers.conf`.
- **152-ФЗ.** `BACKUP_DIR` (`/var/backups/leads-db`) — `chmod 700`, владелец
  `$APP_USER`. В базе телефоны и имена — не синхронизируйте бэкапы в
  зарубежные облака (S3/Dropbox вне РФ и т.п.), это прямое требование
  локализации персональных данных.
- **Приватный репозиторий / SSH-remote.** Если `REPO` — SSH-ссылка
  (`git@github.com:...`) или приватный HTTPS-репозиторий, `$APP_USER` нужно
  заранее снабдить доступом: либо deploy-key
  (`sudo -u webapp ssh-keygen -t ed25519 -f /home/webapp/.ssh/id_ed25519 -N ''`
  → публичный ключ в настройки репозитория → `ssh-keyscan github.com | sudo -u webapp tee -a /home/webapp/.ssh/known_hosts`),
  либо git credential helper с токеном. Скрипт этого не делает автоматически.

## Финальный чек-лист проверки

После всех трёх скриптов:

```bash
# 1. Слушающие порты — должны быть только SSH_PORT, 80, 443 (и локально APP_PORT)
ss -tulpn

# 2. Firewall — deny incoming по умолчанию, разрешены только нужные порты
sudo ufw status verbose

# 3. Эффективный конфиг sshd — порт, PermitRootLogin no, PasswordAuthentication no
sudo sshd -T | grep -Ei '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication)'

# 4. fail2ban — sshd + nginx-http-auth + nginx-limit-req + nginx-botsearch активны
sudo fail2ban-client status

# 5. Сертификат и автопродление
sudo certbot certificates
systemctl list-timers certbot.timer

# 6. Приложение
sudo -u webapp pm2 status
curl -I https://smenaru.ru
curl -s -o /dev/null -w '%{http_code}\n' https://www.smenaru.ru   # ожидаем 301 → smenaru.ru

# 7. Rate limit на форму лидов (11-й запрос подряд должен вернуть 429)
for i in $(seq 1 11); do curl -s -o /dev/null -w '%{http_code} ' -X POST https://smenaru.ru/api/lead; done; echo

# 8. Ежедневный ребилд блога и бэкапы
systemctl list-timers blog-rebuild.timer
cat /etc/cron.d/leads-db-backup
ls -la /var/backups/leads-db/

# 9. Внешняя проверка TLS-конфигурации (оценка A/A+, слабые протоколы/шифры)
#    https://www.ssllabs.com/ssltest/analyze.html?d=smenaru.ru
```

Если что-то из пункта 1–4 выглядит не так — не открывайте сайт публично,
разбирайтесь на месте (у вас есть текущая SSH-сессия, hardening это не
блокирует полностью, только сужает поверхность атаки).
