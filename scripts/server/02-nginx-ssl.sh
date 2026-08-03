#!/usr/bin/env bash
#
# 02-nginx-ssl.sh — nginx reverse proxy + Let's Encrypt для DOMAIN
#
# Что делает:
#   - ставит nginx + модули brotli
#   - открывает HTTP-сервер только для ACME-челленджа + редиректа на https
#   - выпускает сертификат Let's Encrypt (webroot-метод, без плагина certbot-nginx —
#     чтобы certbot не переписывал наш server-блок по-своему)
#   - разворачивает финальный HTTPS-конфиг: reverse proxy на 127.0.0.1:$APP_PORT,
#     HTTP/2, gzip+brotli, security-заголовки, rate limit на /api/lead и /api/lead-intent
#   - редирект http→https и www→non-www в одно перенаправление
#   - настраивает auto-renew (certbot.timer из пакета + deploy-hook reload nginx)
#   - дочищивает fail2ban: включает nginx-* jail'ы теперь, когда логи существуют
#
# Идемпотентен: можно перезапускать сколько угодно, конфиги перезаписываются детерминированно.
#
# Запуск (от sudo-пользователя с правами sudo, см. 01-harden.sh):
#   sudo DOMAIN=smenaru.ru CERTBOT_EMAIL=you@example.com bash 02-nginx-ssl.sh
#

set -euo pipefail

# ─────────────────────────── ПЕРЕМЕННЫЕ ───────────────────────────────────
DOMAIN="${DOMAIN:-smenaru.ru}"
WWW_DOMAIN="www.${DOMAIN}"
APP_PORT="${APP_PORT:-3000}"                       # куда проксируем (127.0.0.1:$APP_PORT), должен совпадать с портом в 03-app-deploy.sh
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"  # для уведомлений об истечении сертификата
WEBROOT="/var/www/certbot"

log()  { echo -e "\033[0;32m[02-nginx-ssl]\033[0m $*"; }
warn() { echo -e "\033[1;33m[02-nginx-ssl][WARN]\033[0m $*"; }
err()  { echo -e "\033[0;31m[02-nginx-ssl][ERR]\033[0m $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Запускать нужно от root (или через sudo)"
  exit 1
fi

log "DOMAIN=$DOMAIN APP_PORT=$APP_PORT CERTBOT_EMAIL=$CERTBOT_EMAIL"

# ─────────────────────────── 1. ПАКЕТЫ ─────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
log "Ставим nginx, brotli-модули, certbot..."
apt-get install -y -qq \
  nginx \
  libnginx-mod-http-brotli-static libnginx-mod-http-brotli-filter \
  certbot

systemctl enable nginx >/dev/null 2>&1 || true

# Дефолтный сайт nginx нам не нужен и может конфликтовать по server_name/default_server
rm -f /etc/nginx/sites-enabled/default

mkdir -p "$WEBROOT"

# ─────────────────────────── 2. ОБЩИЕ CONF.D СНИППЕТЫ ─────────────────────
log "Пишем общие snippets (gzip, brotli, rate-limit, security-заголовки)..."

cat > /etc/nginx/conf.d/gzip.conf <<'EOF'
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_min_length 256;
gzip_proxied any;
gzip_types
  text/plain text/css text/xml text/javascript
  application/javascript application/json application/xml
  application/rss+xml image/svg+xml font/woff2;
EOF

cat > /etc/nginx/conf.d/brotli.conf <<'EOF'
brotli on;
brotli_comp_level 5;
brotli_types
  text/plain text/css text/xml text/javascript
  application/javascript application/json application/xml
  application/rss+xml image/svg+xml font/woff2;
brotli_static on;
EOF

# limit_req_zone обязан жить в http{} — conf.d как раз инклюдится на этом уровне.
# 5 запросов/мин с одного IP на форму лидов + небольшой burst — щадяще для
# реального пользователя (пара кликов/ретраев), но режет спам-скрипты.
cat > /etc/nginx/conf.d/rate-limit.conf <<EOF
limit_req_zone \$binary_remote_addr zone=lead_limit:10m rate=5r/m;
limit_req_status 429;
EOF

mkdir -p /etc/nginx/snippets
cat > /etc/nginx/snippets/security-headers.conf <<'EOF'
# HSTS — включаем только внутри HTTPS-блока (см. server 443)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

# ЗАГОТОВКА CSP: разложена под текущий стек (Next.js + Яндекс.Метрика/Вебвизор).
# Отдаём как Report-Only, чтобы сначала посмотреть в консоли браузера и в
# отчётах, что реально блокируется бы, и только потом включить принудительно
# (замените заголовок на Content-Security-Policy, когда убедитесь что ничего
# не ломается — картинки, шрифты, сторонние виджеты и т.п.).
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.webvisor.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru https://*.yandex.ru https://*.yandex.net; font-src 'self' data:; connect-src 'self' https://mc.yandex.ru https://*.yandex.ru; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none';" always;
EOF

# ─────────────────────────── 3. HTTP-СЕРВЕР (80) ───────────────────────────
# На этом шаге сертификата ещё может не быть — нужен рабочий :80 для ACME.
# Всё остальное сразу редиректим на https+non-www одним прыжком.
log "Пишем временный/постоянный HTTP-блок (порт 80)..."
cat > /etc/nginx/sites-available/"$DOMAIN".conf <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://${DOMAIN}\$request_uri;
    }
}
EOF

ln -sf /etc/nginx/sites-available/"$DOMAIN".conf /etc/nginx/sites-enabled/"$DOMAIN".conf

log "Проверяем nginx -t и перезапускаем..."
nginx -t
systemctl reload nginx || systemctl restart nginx

# ─────────────────────────── 4. СЕРТИФИКАТ LET'S ENCRYPT ───────────────────
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [[ -f "$CERT_DIR/fullchain.pem" ]]; then
  log "Сертификат для $DOMAIN уже есть — certbot renew (no-op, если срок ещё далеко)."
  certbot renew --webroot -w "$WEBROOT" --quiet || warn "certbot renew вернул ошибку, проверьте вручную: certbot certificates"
else
  log "Выпускаем сертификат для $DOMAIN и $WWW_DOMAIN (webroot)..."
  certbot certonly --webroot -w "$WEBROOT" \
    -d "$DOMAIN" -d "$WWW_DOMAIN" \
    --non-interactive --agree-tos -m "$CERTBOT_EMAIL" \
    --keep-until-expiring
fi

if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
  err "Сертификат не найден в $CERT_DIR после certbot — проверьте DNS-записи $DOMAIN/$WWW_DOMAIN на этот сервер и лог /var/log/letsencrypt/letsencrypt.log"
  exit 1
fi

# deploy-hook: после автопродления certbot.timer должен перечитать nginx
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/usr/bin/env bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

systemctl enable certbot.timer >/dev/null 2>&1 || true
systemctl start certbot.timer >/dev/null 2>&1 || true

# ─────────────────────────── 5. ФИНАЛЬНЫЙ HTTPS-КОНФИГ ─────────────────────
log "Пишем финальный HTTPS server-блок (proxy + заголовки + rate limit)..."
cat > /etc/nginx/sites-available/"$DOMAIN".conf <<EOF
# www → non-www редирект по HTTPS (тот же сертификат покрывает оба SAN)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${WWW_DOMAIN};

    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;

    return 301 https://${DOMAIN}\$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://${DOMAIN}\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    include /etc/nginx/snippets/security-headers.conf;

    client_max_body_size 1m;

    # Форма лидов — самое чувствительное к спаму место, режем через lead_limit.
    location /api/lead {
        limit_req zone=lead_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/lead-intent {
        limit_req zone=lead_limit burst=5 nodelay;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
    }
}
EOF

log "Проверяем финальный nginx -t..."
nginx -t
systemctl reload nginx

# ─────────────────────────── 6. FAIL2BAN: ДОКЛЮЧАЕМ NGINX JAIL'Ы ───────────
log "Перечитываем fail2ban — теперь логи nginx существуют, jail'ы nginx-* оживут..."
systemctl restart fail2ban

# ─────────────────────────── ФИНАЛЬНЫЕ ПРОВЕРКИ ───────────────────────────
echo
log "=== Проверки безопасности (шаг 2/2) ==="
echo "--- ufw status ---"
ufw status verbose
echo "--- слушающие порты (ss -tulpn) — должны быть только SSH-порт, 80, 443 ---"
ss -tulpn || true
echo "--- сертификаты certbot ---"
certbot certificates
echo "--- fail2ban jails ---"
fail2ban-client status || true

echo
log "Готово. https://${DOMAIN} проксирует на 127.0.0.1:${APP_PORT} — приложение ещё не поднято, это делает 03-app-deploy.sh."
log "После деплоя приложения проверьте оценку TLS: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
