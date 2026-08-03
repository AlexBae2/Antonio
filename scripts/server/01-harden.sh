#!/usr/bin/env bash
#
# 01-harden.sh — базовый хардeнинг VPS (Ubuntu 24.04, Timeweb Cloud)
#
# Что делает:
#   - обновляет систему, ставит unattended-upgrades (авто security-патчи)
#   - создаёт sudo-пользователя для деплоя, копирует/прописывает SSH-ключ
#   - хардeнит sshd: свой порт, PermitRootLogin no, PasswordAuthentication no
#   - ufw: закрывает всё кроме SSH-порта, 80, 443
#   - fail2ban: jail на sshd + заготовки под nginx (активируются в 02-скрипте)
#   - sysctl: сетевой хардeнинг ядра
#
# Идемпотентен: можно запускать повторно, ничего не сломает и не задвоит.
#
# ВАЖНО ПРО ЛОКАУТ: скрипт меняет SSH-порт и отключает вход по паролю/root.
# Если что-то пойдёт не так — можно потерять доступ к серверу. Скрипт:
#   1) не закрывает старый порт 22 в ufw автоматически;
#   2) проверяет sshd_config через `sshd -t` перед перезапуском;
#   3) (если AUTO_CONFIRM=false) остановится перед перезапуском sshd и попросит
#      подтверждения, чтобы вы успели прочитать, что сейчас произойдёт.
# После прогона ОБЯЗАТЕЛЬНО откройте НОВЫЙ терминал и проверьте вход новым
# пользователем на новом порту, не закрывая текущую сессию. См. README.md.
#
# Запуск: sudo bash 01-harden.sh
#

set -euo pipefail

# ─────────────────────────── ПЕРЕМЕННЫЕ ───────────────────────────────────
SSH_PORT="${SSH_PORT:-2202}"                 # нестандартный SSH-порт
DEPLOY_USER="${DEPLOY_USER:-deploy}"         # sudo-пользователь для деплоя/администрирования
DEPLOY_USER_SSH_KEY="${DEPLOY_USER_SSH_KEY:-}" # публичный ключ (ssh-ed25519 AAAA... comment). Пусто = скопировать текущий root'овый authorized_keys
AUTO_CONFIRM="${AUTO_CONFIRM:-false}"        # true — не спрашивать подтверждение перед рестартом sshd (для CI/автоматизации)

# fail2ban
F2B_BANTIME="${F2B_BANTIME:-1h}"
F2B_FINDTIME="${F2B_FINDTIME:-10m}"
F2B_MAXRETRY="${F2B_MAXRETRY:-5}"

# unattended-upgrades
AUTO_REBOOT="${AUTO_REBOOT:-true}"           # авто-перезагрузка после security-апдейтов ядра
AUTO_REBOOT_TIME="${AUTO_REBOOT_TIME:-04:30}" # локальное время сервера (обычно UTC на свежем VPS, проверьте timedatectl)

# ─────────────────────────── ЛОГИРОВАНИЕ ──────────────────────────────────
c_green='\033[0;32m'; c_yellow='\033[1;33m'; c_red='\033[0;31m'; c_reset='\033[0m'
log()  { echo -e "${c_green}[01-harden]${c_reset} $*"; }
warn() { echo -e "${c_yellow}[01-harden][WARN]${c_reset} $*"; }
err()  { echo -e "${c_red}[01-harden][ERR]${c_reset} $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Запускать нужно от root (sudo bash 01-harden.sh)"
  exit 1
fi

log "Домен/сервер настраивается с SSH_PORT=$SSH_PORT, DEPLOY_USER=$DEPLOY_USER"

# ─────────────────────────── 1. ОБНОВЛЕНИЕ СИСТЕМЫ ────────────────────────
log "apt update && upgrade..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get -y -qq upgrade

log "Ставим базовые пакеты..."
apt-get install -y -qq \
  ufw fail2ban unattended-upgrades apt-listchanges \
  curl wget git sudo ca-certificates gnupg lsb-release \
  apt-transport-https software-properties-common

# ─────────────────────────── 2. ПОЛЬЗОВАТЕЛЬ DEPLOY ───────────────────────
if id -u "$DEPLOY_USER" &>/dev/null; then
  log "Пользователь $DEPLOY_USER уже существует — пропускаем создание."
else
  log "Создаём пользователя $DEPLOY_USER..."
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

usermod -aG sudo "$DEPLOY_USER"

DEPLOY_HOME="/home/$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_HOME/.ssh"

if [[ -n "$DEPLOY_USER_SSH_KEY" ]]; then
  log "Прописываем ключ из DEPLOY_USER_SSH_KEY в authorized_keys..."
  echo "$DEPLOY_USER_SSH_KEY" > "$DEPLOY_HOME/.ssh/authorized_keys"
elif [[ -f /root/.ssh/authorized_keys ]]; then
  log "DEPLOY_USER_SSH_KEY не задан — копируем текущий root/.ssh/authorized_keys (обычно это и есть ваш ключ, добавленный при создании VPS в Timeweb)."
  cp /root/.ssh/authorized_keys "$DEPLOY_HOME/.ssh/authorized_keys"
else
  warn "Не найден ни DEPLOY_USER_SSH_KEY, ни /root/.ssh/authorized_keys."
  warn "Добавьте ключ вручную в $DEPLOY_HOME/.ssh/authorized_keys ДО перезапуска sshd, иначе потеряете доступ!"
fi

chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys" 2>/dev/null || true
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"

# passwordless sudo для deploy-пользователя — удобно для деплой-скрипта (03-app-deploy.sh),
# который дёргается в т.ч. из systemd-таймера без интерактивного ввода пароля.
cat > /etc/sudoers.d/90-"$DEPLOY_USER" <<EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL
EOF
chmod 440 /etc/sudoers.d/90-"$DEPLOY_USER"
visudo -cf /etc/sudoers.d/90-"$DEPLOY_USER" >/dev/null

log "Пользователь $DEPLOY_USER настроен (sudo + ключ)."

# ─────────────────────────── 3. SSH HARDENING ─────────────────────────────
log "Хардeним sshd (drop-in /etc/ssh/sshd_config.d/00-hardening.conf)..."

# Важно: имя файла начинается с "00-", чтобы гарантированно идти ПЕРВЫМ в
# алфавитном порядке среди файлов sshd_config.d/*.conf. У sshd действует
# правило "первое встреченное значение директивы побеждает", а на облачных
# образах Ubuntu (в т.ч. Timeweb) нередко уже лежит cloud-init дроп-ин вида
# 50-cloud-init.conf с PasswordAuthentication yes. Если наш файл будет
# называться, например, 99-hardening.conf — он проиграет и хардeнинг тихо
# не применится. С "00-" мы всегда read'имся раньше таких файлов.
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/00-hardening.conf <<EOF
# Сгенерировано 01-harden.sh — руками не редактировать, менять переменные в скрипте.
Port ${SSH_PORT}
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers ${DEPLOY_USER}
EOF

# Информационная проверка: не молчим, если рядом есть другой дроп-ин,
# который может конфликтовать (просто предупреждаем, ничего не трогаем).
if grep -rlE '^\s*(PasswordAuthentication|PermitRootLogin)\s' /etc/ssh/sshd_config.d/*.conf 2>/dev/null \
    | grep -v '00-hardening.conf' >/dev/null; then
  warn "Найдены другие sshd_config.d/*.conf с PasswordAuthentication/PermitRootLogin."
  warn "Наш 00-hardening.conf должен победить (идёт первым алфавитно), но проверьте вручную: sshd -T | grep -i passwordauth"
fi

log "Проверяем синтаксис sshd_config (sshd -t)..."
if ! sshd -t; then
  err "sshd -t вернул ошибку — конфиг НЕ применяем, чтобы не потерять доступ. Останавливаемся."
  exit 1
fi

# Ubuntu 24.04 в некоторых образах активирует ssh через socket-activation
# (ssh.socket слушает порт и поднимает ssh.service по требованию). Если это
# так — одного Port в sshd_config недостаточно, порт слушает сам сокет-юнит.
# Правим оба места на всякий случай, это безопасно даже если socket не используется.
if systemctl list-unit-files 2>/dev/null | grep -q '^ssh.socket'; then
  log "Обнаружен ssh.socket — переопределяем ListenStream через override..."
  mkdir -p /etc/systemd/system/ssh.socket.d
  cat > /etc/systemd/system/ssh.socket.d/override.conf <<EOF
[Socket]
ListenStream=
ListenStream=${SSH_PORT}
EOF
  systemctl daemon-reload
  SSH_SOCKET_ACTIVE=true
else
  SSH_SOCKET_ACTIVE=false
fi

# ─────────────────────────── 4. UFW ───────────────────────────────────────
log "Настраиваем ufw (default deny incoming)..."
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'ssh (custom port)'

# Старый 22-й порт СОЗНАТЕЛЬНО не закрываем прямо сейчас — если SSH_PORT != 22,
# оставляем текущую сессию рабочей до ручной проверки нового порта.
if [[ "$SSH_PORT" != "22" ]]; then
  ufw allow 22/tcp comment 'ssh (temporary, remove after verifying new port)'
  warn "Порт 22 временно оставлен открытым. После проверки входа на порту ${SSH_PORT} закройте его:"
  warn "  sudo ufw delete allow 22/tcp"
fi

ufw allow 80/tcp comment 'http (certbot + redirect)'
ufw allow 443/tcp comment 'https'
ufw --force enable

# ─────────────────────────── 5. FAIL2BAN ──────────────────────────────────
log "Настраиваем fail2ban (jail.local: sshd + заготовки под nginx)..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = ${F2B_BANTIME}
findtime = ${F2B_FINDTIME}
maxretry = ${F2B_MAXRETRY}
backend  = systemd
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled  = true
port     = ${SSH_PORT}
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s

# Ниже — jail'ы под nginx. Они безопасно лежат тут, но реально включатся
# (и не будут ругаться на отсутствующие логи) только после 02-nginx-ssl.sh,
# который перечитывает fail2ban уже после установки nginx.
[nginx-http-auth]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
findtime = 10m
maxretry = 10
bantime  = 24h

[nginx-botsearch]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log
EOF

systemctl enable fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban
log "fail2ban запущен. Статус jail'ов nginx-* будет 'not found' до установки nginx — это нормально."

# ─────────────────────────── 6. UNATTENDED-UPGRADES ───────────────────────
log "Настраиваем unattended-upgrades (авто security-патчи)..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# Правим только нужные строки в шаблоне 50unattended-upgrades, не переписываем
# весь файл (там есть полезный дефолтный список security-источников Ubuntu).
UU_CONF=/etc/apt/apt.conf.d/50unattended-upgrades
if [[ -f "$UU_CONF" ]]; then
  sed -i 's/^\/\/\?Unattended-Upgrade::Remove-Unused-Automatically.*/Unattended-Upgrade::Remove-Unused-Automatically "true";/' "$UU_CONF"
  if [[ "$AUTO_REBOOT" == "true" ]]; then
    sed -i 's/^\/\/\?Unattended-Upgrade::Automatic-Reboot .*/Unattended-Upgrade::Automatic-Reboot "true";/' "$UU_CONF"
    sed -i "s/^\/\/\?Unattended-Upgrade::Automatic-Reboot-Time.*/Unattended-Upgrade::Automatic-Reboot-Time \"${AUTO_REBOOT_TIME}\";/" "$UU_CONF"
  else
    sed -i 's/^\/\/\?Unattended-Upgrade::Automatic-Reboot .*/Unattended-Upgrade::Automatic-Reboot "false";/' "$UU_CONF"
  fi
fi

systemctl enable unattended-upgrades >/dev/null 2>&1 || true
systemctl restart unattended-upgrades

# ─────────────────────────── 7. SYSCTL HARDENING ──────────────────────────
log "Применяем sysctl-хардeнинг (/etc/sysctl.d/99-hardening.conf)..."
cat > /etc/sysctl.d/99-hardening.conf <<'EOF'
# Сгенерировано 01-harden.sh

# Anti IP-spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Не принимать ICMP redirect (нельзя подменить маршруты через ICMP)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0

# Сервер не роутер — не шлём redirect и не форвардим
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Запрет source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Игнорировать ICMP broadcast / бракованные ICMP
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Логировать пакеты с невозможным (spoofed) адресом источника
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2

# Урезаем видимость ядра
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
fs.suid_dumpable = 0
EOF

sysctl --system >/dev/null

# ─────────────────────────── 8. РЕСТАРТ SSHD ──────────────────────────────
echo
warn "Сейчас применится смена SSH-порта (${SSH_PORT}) и отключится вход по паролю/root."
warn "После рестарта sshd НЕ ЗАКРЫВАЙТЕ текущую сессию, пока не проверите в НОВОМ окне:"
warn "  ssh -p ${SSH_PORT} ${DEPLOY_USER}@<IP сервера>"
echo

if [[ "$AUTO_CONFIRM" != "true" ]]; then
  read -r -p "Продолжить и перезапустить sshd? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    err "Отменено пользователем. sshd НЕ перезапущен — hardening-конфиг уже записан, примените позже: systemctl restart ssh"
    exit 1
  fi
fi

if [[ "$SSH_SOCKET_ACTIVE" == "true" ]]; then
  systemctl restart ssh.socket
fi
systemctl restart ssh

log "sshd перезапущен на порту ${SSH_PORT}."

# ─────────────────────────── ФИНАЛЬНЫЕ ПРОВЕРКИ ───────────────────────────
echo
log "=== Проверки безопасности (шаг 1/2) ==="
echo "--- ufw status ---"
ufw status verbose
echo "--- sshd -T (ключевые директивы) ---"
sshd -T | grep -Ei '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication|allowusers) '
echo "--- fail2ban jails ---"
fail2ban-client status || true
echo "--- слушающие порты (ss -tulpn) ---"
ss -tulpn || true

echo
log "Готово. Дальше: sudo DOMAIN=smenaru.ru bash 02-nginx-ssl.sh"
log "НЕ ЗАБУДЬТЕ проверить вход новым пользователем на новом порту в отдельном терминале!"
