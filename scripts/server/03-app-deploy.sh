#!/usr/bin/env bash
#
# 03-app-deploy.sh — деплой Next.js-приложения (Node 22 + pm2), бэкапы, автопостинг блога
#
# Что делает:
#   - ставит Node 22 LTS (NodeSource) и pm2, если их ещё нет
#   - заводит отдельного системного пользователя для запуска приложения
#     (НЕ deploy/sudo-пользователя — компрометация приложения не даёт sudo)
#   - git clone/pull + npm ci + npm run build:server, копирует public/.next/static
#     внутрь .next/standalone (так требует Next.js standalone output)
#   - запускает/перезагружает приложение через pm2 (max_memory_restart, автозапуск)
#   - устанавливает СЕБЯ в /usr/local/sbin и вешает systemd-таймер — ежедневный
#     git pull + build + reload, чтобы публиковались статьи с наступившим publishAt
#     (то же самое, что делает cron в .github/workflows/deploy.yml для GH Pages,
#     только для прод-сервера)
#   - настраивает cron-бэкап data/leads.db (безопасный .backup, не голый cp) с ротацией
#
# Идемпотентен: безопасно перезапускать вручную и по таймеру.
#
# Первый запуск (от sudo-пользователя, из 01-harden.sh):
#   sudo REPO=git@github.com:you/courier-jobs-site.git DOMAIN=smenaru.ru \
#        APP_PORT=3000 bash 03-app-deploy.sh
#
# ВАЖНО: APP_PORT здесь должен совпадать с APP_PORT в 02-nginx-ssl.sh.
#

set -euo pipefail

# ─────────────────────────── ПЕРЕМЕННЫЕ ───────────────────────────────────
REPO="${REPO:-https://github.com/AlexBae2/Antonio.git}"  # ссылка на репозиторий (HTTPS для публичного, SSH — см. README про deploy-key)
DOMAIN="${DOMAIN:-smenaru.ru}"                                  # для логов/сообщений
APP_USER="${APP_USER:-webapp}"                                  # отдельный юзер под приложение (не sudo)
DEPLOY_USER="${DEPLOY_USER:-deploy}"                             # sudo-пользователь-админ (из 01-harden.sh) — добавим в группу webapp для удобных pm2 logs
APP_DIR="${APP_DIR:-/home/${APP_USER}/app}"
APP_PORT="${APP_PORT:-3000}"                                    # ДОЛЖЕН совпадать с APP_PORT в 02-nginx-ssl.sh
NODE_MAJOR="${NODE_MAJOR:-22}"
PM2_MAX_MEMORY="${PM2_MAX_MEMORY:-400M}"

# node:sqlite (используется в lib/server/db.ts) до сих пор требует этот флаг
# на Node 22.x — без него pm2 упадёт на первом же запросе к /api/lead с
# ERR_UNKNOWN_BUILTIN_MODULE. На локальной машине разработчика это может не
# бросаться в глаза, если там стоит Node 24+ (там флаг уже не нужен) —
# именно поэтому ловим это здесь явно, а не полагаемся, что "и так заработает".
# --dns-result-order=ipv4first: на VPS Timeweb исходящий IPv4 отвечал не всегда,
# и fetch к api.telegram.org зависал до таймаута в режиме verbatim (2 падения из 3
# замеров). С этим флагом уведомления о заявках уходят стабильно.
APP_NODE_OPTIONS="${APP_NODE_OPTIONS:---experimental-sqlite --dns-result-order=ipv4first}"

# бэкапы
BACKUP_DIR="${BACKUP_DIR:-/var/backups/leads-db}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_CRON_TIME="${BACKUP_CRON_TIME:-15 2 * * *}"   # ежедневно в 02:15 UTC, до ребилда блога

# ежедневный ребилд (автопостинг блога)
REBUILD_CRON_TIME_UTC="${REBUILD_CRON_TIME_UTC:-03:30:00}"  # согласовано с cron GH Pages (30 3 * * * UTC)

DEPLOY_SCRIPT_PATH="/usr/local/sbin/deploy-${DOMAIN}.sh"

log()  { echo -e "\033[0;32m[03-app-deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[03-app-deploy][WARN]\033[0m $*"; }
err()  { echo -e "\033[0;31m[03-app-deploy][ERR]\033[0m $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Запускать нужно от root (или через sudo) — нужно ставить пакеты и системного пользователя"
  exit 1
fi

log "REPO=$REPO APP_USER=$APP_USER APP_DIR=$APP_DIR APP_PORT=$APP_PORT"

# ─────────────────────────── 1. NODE 22 LTS ────────────────────────────────
CURRENT_MAJOR="$(node -v 2>/dev/null | grep -oE '^v[0-9]+' | tr -d 'v' || echo 0)"
if [[ "$CURRENT_MAJOR" != "$NODE_MAJOR" ]]; then
  log "Ставим Node ${NODE_MAJOR}.x (NodeSource)..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
else
  log "Node ${NODE_MAJOR}.x уже стоит ($(node -v)) — пропускаем."
fi

# ─────────────────────────── 2. PM2, ПАКЕТЫ ────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Ставим pm2 глобально..."
  npm install -g pm2
fi

export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq git rsync sqlite3

# ─────────────────────────── 3. ПОЛЬЗОВАТЕЛЬ ПРИЛОЖЕНИЯ ───────────────────
if id -u "$APP_USER" &>/dev/null; then
  log "Пользователь $APP_USER уже существует."
else
  log "Создаём системного пользователя $APP_USER (без сохранённого пароля, без sudo)..."
  adduser --system --group --home "/home/${APP_USER}" --shell /usr/sbin/nologin --disabled-login "$APP_USER"
fi

# Удобство для админа: DEPLOY_USER в группе APP_USER — можно смотреть pm2 logs
# без su/sudo -u каждый раз. Прав на запись это НЕ даёт (только чтение группы).
if id -u "$DEPLOY_USER" &>/dev/null; then
  usermod -aG "$APP_USER" "$DEPLOY_USER" 2>/dev/null || true
fi

mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

as_app() {
  # Выполняет команду от имени APP_USER с его HOME (нужно для npm cache и т.п.)
  sudo -u "$APP_USER" -H bash -lc "$*"
}

# ─────────────────────────── 4. GIT CLONE / PULL ──────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  log "Репозиторий уже склонирован в $APP_DIR — git pull..."
  as_app "cd '$APP_DIR' && git pull --ff-only"
else
  log "Клонируем $REPO в $APP_DIR..."
  as_app "git clone '$REPO' '$APP_DIR'"
fi

# ─────────────────────────── 5. .env (не перезаписываем!) ─────────────────
if [[ ! -f "$APP_DIR/.env" ]]; then
  warn "$APP_DIR/.env не найден. Создайте его вручную ДО первого реального деплоя, см. README.md проекта:"
  warn "  NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_METRIKA_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, IP_HASH_SALT, ADMIN_TOKEN"
  as_app "touch '$APP_DIR/.env'"
fi

# ─────────────────────────── 6. СБОРКА ────────────────────────────────────
log "npm ci..."
as_app "cd '$APP_DIR' && npm ci --no-audit --no-fund"

log "npm run build:server..."
as_app "cd '$APP_DIR' && NODE_OPTIONS='${APP_NODE_OPTIONS}' npm run build:server"

# Next.js standalone output не включает public/ и .next/static — копируем руками
# при КАЖДОМ билде (build:server делает rm -rf .next, так что предыдущая копия стирается).
log "Копируем public/ и .next/static/ в .next/standalone/..."
as_app "cd '$APP_DIR' && mkdir -p .next/standalone/.next && \
  rsync -a --delete public/ .next/standalone/public/ && \
  rsync -a --delete .next/static/ .next/standalone/.next/static/"

# data/ и content/ копировать НЕ нужно: lib/server/db.ts и lib/blog.ts читают их
# через process.cwd(), а pm2 запускает server.js с cwd=$APP_DIR (см. ecosystem
# ниже) — то есть они и так видят настоящие data/leads.db и content/blog из
# корня репозитория, а не копии внутри .next/standalone. Это важно: держим
# базу лидов ВНЕ .next, иначе rm -rf .next при билде стирал бы её.

# ─────────────────────────── 7. PM2 ECOSYSTEM ─────────────────────────────
log "Пишем ecosystem.config.cjs..."
cat > /tmp/ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: 'courier-jobs-site',
    script: '.next/standalone/server.js',
    cwd: '${APP_DIR}',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '${PM2_MAX_MEMORY}',
    env: {
      NODE_ENV: 'production',
      PORT: '${APP_PORT}',
      HOSTNAME: '127.0.0.1',
      NODE_OPTIONS: '${APP_NODE_OPTIONS}',
    },
    out_file: '${APP_DIR}/logs/out.log',
    error_file: '${APP_DIR}/logs/error.log',
    merge_logs: true,
    time: true,
  }],
};
EOF
as_app "mkdir -p '$APP_DIR/logs'"
install -m 644 -o "$APP_USER" -g "$APP_USER" /tmp/ecosystem.config.cjs "$APP_DIR/ecosystem.config.cjs"
rm -f /tmp/ecosystem.config.cjs

# ─────────────────────────── 8. СТАРТ / RELOAD ─────────────────────────────
if as_app "pm2 describe courier-jobs-site >/dev/null 2>&1"; then
  log "Процесс уже в pm2 — reload (без даунтайма для клиента опроса, кратковременный для fork-режима)..."
  as_app "cd '$APP_DIR' && pm2 reload ecosystem.config.cjs --update-env"
else
  log "Первый запуск — pm2 start..."
  as_app "cd '$APP_DIR' && pm2 start ecosystem.config.cjs"
fi
as_app "pm2 save"

# pm2 startup — автозапуск при ребуте сервера. Идемпотентно: пропускаем, если
# systemd-юнит для этого пользователя уже есть.
PM2_UNIT="/etc/systemd/system/pm2-${APP_USER}.service"
if [[ ! -f "$PM2_UNIT" ]]; then
  log "Настраиваем pm2 startup (systemd) для $APP_USER..."
  # pm2 startup печатает готовую команду для установки systemd-юнита последней
  # строкой — это официально задокументированный способ её подхватить.
  # Не даём этому шагу уронить весь деплой, если pm2 когда-нибудь поменяет формат
  # вывода: тогда просто предупреждаем и просим прогнать команду руками.
  STARTUP_CMD="$(env PATH="$PATH:/usr/bin:/usr/local/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/${APP_USER}" | tail -n1)"
  if [[ "$STARTUP_CMD" == *systemctl* ]]; then
    bash -c "$STARTUP_CMD"
    as_app "pm2 save"
  else
    warn "Не удалось автоматически распарсить вывод 'pm2 startup' — настройте автозапуск вручную:"
    warn "  sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}"
    warn "  (выполнить команду, которую эта команда напечатает)"
  fi
else
  log "pm2-${APP_USER}.service уже настроен — пропускаем."
fi

# ─────────────────────────── 9. АВТОДЕПЛОЙ: САМОКОПИРОВАНИЕ + ТАЙМЕР ──────
log "Устанавливаем себя в $DEPLOY_SCRIPT_PATH для ежедневного автозапуска..."
install -m 750 -o root -g root "$0" "$DEPLOY_SCRIPT_PATH"

cat > /etc/systemd/system/blog-rebuild.service <<EOF
[Unit]
Description=Ежедневный git pull + build:server + pm2 reload (автопостинг блога, ${DOMAIN})
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=REPO=${REPO}
Environment=DOMAIN=${DOMAIN}
Environment=APP_USER=${APP_USER}
Environment=DEPLOY_USER=${DEPLOY_USER}
Environment=APP_DIR=${APP_DIR}
Environment=APP_PORT=${APP_PORT}
Environment=NODE_MAJOR=${NODE_MAJOR}
Environment=PM2_MAX_MEMORY=${PM2_MAX_MEMORY}
Environment=APP_NODE_OPTIONS=${APP_NODE_OPTIONS}
Environment=BACKUP_DIR=${BACKUP_DIR}
Environment=BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS}
ExecStart=${DEPLOY_SCRIPT_PATH}
EOF

cat > /etc/systemd/system/blog-rebuild.timer <<EOF
[Unit]
Description=Таймер: ежедневный ребилд сайта (автопостинг блога, ${DOMAIN})

[Timer]
OnCalendar=*-*-* ${REBUILD_CRON_TIME_UTC} UTC
Persistent=true
RandomizedDelaySec=120

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now blog-rebuild.timer

log "Таймер blog-rebuild.timer настроен на ${REBUILD_CRON_TIME_UTC} UTC (согласовано с cron GH Pages)."

# ─────────────────────────── 10. БЭКАПЫ SQLITE ────────────────────────────
log "Настраиваем бэкап data/leads.db (cron + ротация)..."

mkdir -p "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"   # в базе телефоны/имена — 152-ФЗ, доступ только владельцу

cat > /usr/local/sbin/backup-leads-db.sh <<EOF
#!/usr/bin/env bash
# Сгенерировано 03-app-deploy.sh. Безопасный бэкап через SQLite .backup —
# в отличие от голого cp, не корраптится при параллельной записи от pm2-процесса.
set -euo pipefail

APP_DIR="${APP_DIR}"
BACKUP_DIR="${BACKUP_DIR}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS}"
DB_FILE="\$APP_DIR/data/leads.db"
STAMP="\$(date +%F_%H%M%S)"
OUT="\$BACKUP_DIR/leads-\$STAMP.db"

if [[ ! -f "\$DB_FILE" ]]; then
  echo "leads.db не найден по пути \$DB_FILE, пропускаем." >&2
  exit 0
fi

sqlite3 "\$DB_FILE" ".backup '\$OUT'"
gzip -f "\$OUT"

find "\$BACKUP_DIR" -name 'leads-*.db.gz' -mtime "+\$RETENTION_DAYS" -delete

echo "Бэкап готов: \$OUT.gz"
EOF
chmod 750 /usr/local/sbin/backup-leads-db.sh
chown "$APP_USER:$APP_USER" /usr/local/sbin/backup-leads-db.sh

cat > /etc/cron.d/leads-db-backup <<EOF
# Сгенерировано 03-app-deploy.sh
${BACKUP_CRON_TIME} ${APP_USER} /usr/local/sbin/backup-leads-db.sh >> /var/log/leads-db-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/leads-db-backup
touch /var/log/leads-db-backup.log
chown "$APP_USER:$APP_USER" /var/log/leads-db-backup.log

# ─────────────────────────── ФИНАЛЬНЫЕ ПРОВЕРКИ ───────────────────────────
echo
log "=== Проверки приложения ==="
sleep 2
echo "--- pm2 status ---"
as_app "pm2 status"
echo "--- smoke-test (curl 127.0.0.1:${APP_PORT}) ---"
if curl -fsS -o /dev/null -w 'HTTP %{http_code}\n' "http://127.0.0.1:${APP_PORT}/" ; then
  log "Приложение отвечает на 127.0.0.1:${APP_PORT}."
else
  err "Приложение НЕ отвечает на 127.0.0.1:${APP_PORT} — смотрите: sudo -u ${APP_USER} pm2 logs"
fi
echo "--- blog-rebuild.timer ---"
systemctl list-timers blog-rebuild.timer --no-pager || true
echo "--- cron-бэкап ---"
cat /etc/cron.d/leads-db-backup

echo
log "Готово. Если DNS уже указывает на этот сервер и 02-nginx-ssl.sh отработал — сайт доступен по https://${DOMAIN}"
log "Ручной редеплой в дальнейшем: sudo ${DEPLOY_SCRIPT_PATH}  (те же переменные подставлять не нужно — они зашиты в systemd-юнит, а при ручном запуске возьмутся из окружения или дефолтов скрипта)"
