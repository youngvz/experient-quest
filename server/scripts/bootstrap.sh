#!/usr/bin/env bash
# Idempotent EC2 first-boot setup for the multiplayer server. Installs
# Docker + the docker compose plugin, clones the repo to
# /opt/experient-quest, and writes a systemd unit that runs the
# server/ compose stack.
#
# Runs unattended via `user_data` (see infra/terraform/user-data/…),
# but it's also safe to re-execute by hand after code changes — every
# step no-ops when its prerequisite already exists.
#
# Assumes Amazon Linux 2023 (dnf). Adjust the package manager block if
# we ever switch to Ubuntu.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/YOUR-ORG/experient-quest.git}"
REPO_DIR="${REPO_DIR:-/opt/experient-quest}"
MMO_HOSTNAME="${MMO_HOSTNAME:-mmo.example.com}"
SERVICE_NAME="experient-server"

log() { echo "[bootstrap] $*"; }

# 1. Base packages -------------------------------------------------------

log "installing base packages"
dnf -y update
dnf -y install docker git

systemctl enable --now docker
usermod -aG docker ec2-user || true

# 2. docker CLI plugins: buildx + compose -------------------------------
# Amazon Linux 2023 ships an older buildx than the current compose plugin
# requires (compose 2.x → buildx ≥ 0.17). Install both fresh from
# upstream releases into the system CLI-plugin dir so `docker buildx`
# and `docker compose` are both new enough to cooperate.

DOCKER_PLUGIN_DIR=/usr/local/lib/docker/cli-plugins
COMPOSE_BIN="$DOCKER_PLUGIN_DIR/docker-compose"
BUILDX_BIN="$DOCKER_PLUGIN_DIR/docker-buildx"

mkdir -p "$DOCKER_PLUGIN_DIR"

# shellcheck disable=SC2312
ARCH="$(uname -m)"
case "$ARCH" in
	x86_64)  COMPOSE_ARCH="x86_64";   BUILDX_ARCH="amd64" ;;
	aarch64) COMPOSE_ARCH="aarch64";  BUILDX_ARCH="arm64" ;;
	*) echo "unsupported arch $ARCH" >&2; exit 1 ;;
esac

if [ ! -x "$BUILDX_BIN" ]; then
	log "installing docker buildx plugin"
	# Pin to a known-good release. Bump when compose's minimum climbs.
	BUILDX_VER="v0.19.0"
	curl -fsSL \
		"https://github.com/docker/buildx/releases/download/${BUILDX_VER}/buildx-${BUILDX_VER}.linux-${BUILDX_ARCH}" \
		-o "$BUILDX_BIN"
	chmod +x "$BUILDX_BIN"
fi

if [ ! -x "$COMPOSE_BIN" ]; then
	log "installing docker compose plugin"
	curl -fsSL \
		"https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${COMPOSE_ARCH}" \
		-o "$COMPOSE_BIN"
	chmod +x "$COMPOSE_BIN"
fi

# 3. Repo checkout ------------------------------------------------------

if [ ! -d "$REPO_DIR/.git" ]; then
	log "cloning repo → $REPO_DIR"
	git clone "$REPO_URL" "$REPO_DIR"
else
	log "updating repo at $REPO_DIR"
	git -C "$REPO_DIR" pull --ff-only || true
fi

# 4. systemd unit -------------------------------------------------------

UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
log "writing systemd unit $UNIT_PATH"

cat > "$UNIT_PATH" <<UNIT
[Unit]
Description=Experient Quest multiplayer server (docker compose)
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${REPO_DIR}/server
Environment=MMO_HOSTNAME=${MMO_HOSTNAME}
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}.service"

log "bootstrap complete — ${SERVICE_NAME} is active"
