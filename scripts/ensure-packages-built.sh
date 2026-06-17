#!/usr/bin/env bash
# Rebuild workspace packages only when dist is missing or source is newer.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

needs=0

check_pkg() {
  local name="$1"
  local src_glob="$2"
  local dist_marker="$3"

  if [[ ! -f "$dist_marker" ]]; then
    echo "  → $name: dist missing ($dist_marker)"
    needs=1
    return
  fi

  if find $src_glob -type f -newer "$dist_marker" 2>/dev/null | grep -q .; then
    echo "  → $name: source newer than dist"
    needs=1
  fi
}

check_pkg "@cap/devroom-shared" "packages/shared/src -name '*.ts'" "packages/shared/dist/index.js"
check_pkg "@cap/devroom-database" "packages/database/src -name '*.ts'" "packages/database/dist/index.js"

if [[ "$needs" -eq 1 ]] || [[ "${REBUILD_PACKAGES:-}" == "1" ]]; then
  echo "Building workspace packages..."
  bash scripts/rebuild-packages.sh
else
  echo "Workspace packages up to date (set REBUILD_PACKAGES=1 to force)."
fi
