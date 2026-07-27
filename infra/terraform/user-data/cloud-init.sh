#!/usr/bin/env bash
# EC2 user-data — runs unattended at first boot. Delegates the real
# work to server/scripts/bootstrap.sh so Docker install lives in one
# place (that script is also runnable by hand on the box for updates).
#
# Terraform templates ${repo_url} and ${mmo_hostname} into this file
# via templatefile(); anything else the box needs should be exported
# as an env var here so bootstrap.sh stays hostname-agnostic.

set -euo pipefail

exec > >(tee /var/log/experient-user-data.log | logger -t experient-user-data -s 2>/dev/console) 2>&1

echo "[user-data] starting"

# 1. Minimum tools to clone the repo. bootstrap.sh handles docker etc.
dnf -y install git

REPO_DIR=/opt/experient-quest
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "${repo_url}" "$REPO_DIR"
fi

# 2. Hand off to the repo-owned bootstrap script.
export REPO_URL="${repo_url}"
export REPO_DIR
export MMO_HOSTNAME="${mmo_hostname}"

chmod +x "$REPO_DIR/server/scripts/bootstrap.sh"
"$REPO_DIR/server/scripts/bootstrap.sh"

echo "[user-data] finished"
