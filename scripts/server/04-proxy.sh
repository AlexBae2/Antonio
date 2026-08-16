#!/usr/bin/env bash
#
# 04-proxy.sh — HTTP-прокси (3proxy) на отдельном сервере как запасной путь
# до api.telegram.org, если у основного хостера закроют доступ.
#
# Запускать на прокси-сервере от root. Идемпотентен.
#
# Прокси слушает только для одного клиентского IP (основного сервера) —
# открытый в интернет прокси за сутки находят сканеры и начинают гонять
# через него чужой трафик.
#
set -euo pipefail

PROXY_PORT="${PROXY_PORT:-3128}"
PROXY_USER="${PROXY_USER:-smenaru}"
PROXY_PASS="${PROXY_PASS:-}"          # обязателен: без пароля не поднимаем
ALLOW_IP="${ALLOW_IP:-72.56.245.187}" # прод-сервер smenaru.ru

if [ -z "$PROXY_PASS" ]; then
  echo "Задайте PROXY_PASS (пароль прокси-пользователя): PROXY_PASS=... bash 04-proxy.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq 3proxy ufw >/dev/null 2>&1 || apt-get install -y -qq 3proxy >/dev/null

install -d -m 750 /etc/3proxy
cat > /etc/3proxy/3proxy.cfg <<EOF
# Логи с ротацией, без имён пользователей в открытом виде
log /var/log/3proxy/3proxy.log D
rotate 7
logformat "- +_L%d-%m-%Y %H:%M:%S %U %C:%c %R:%r %O %I %T"

nserver 8.8.8.8
nserver 1.1.1.1
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

# Аутентификация по паролю: анонимный прокси в интернете живёт часы
users $PROXY_USER:CL:$PROXY_PASS
auth strong

# Пускаем только прод-сервер и только на HTTPS-порт телеграма
allow $PROXY_USER $ALLOW_IP * 443
deny *

proxy -p$PROXY_PORT -a
EOF
chmod 640 /etc/3proxy/3proxy.cfg
install -d -m 750 /var/log/3proxy

systemctl enable 3proxy >/dev/null 2>&1 || true
systemctl restart 3proxy
sleep 2

# firewall: порт прокси открыт только прод-серверу
if command -v ufw >/dev/null; then
  ufw --force reset >/dev/null 2>&1
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw limit 22/tcp comment 'SSH' >/dev/null
  ufw allow from "$ALLOW_IP" to any port "$PROXY_PORT" proto tcp comment 'прокси для smenaru.ru' >/dev/null
  ufw --force enable >/dev/null
fi

echo "3proxy запущен: $(systemctl is-active 3proxy)"
echo "Строка для .env прод-сервера:"
echo "TELEGRAM_PROXY_URL=http://$PROXY_USER:$PROXY_PASS@$(hostname -I | awk '{print $1}'):$PROXY_PORT"
