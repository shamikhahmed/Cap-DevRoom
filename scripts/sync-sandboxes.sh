#!/usr/bin/env bash
# Sync Cap portfolio into Cap DevRoom sandboxes (copies only — never touches originals)
set -euo pipefail

DEVROOM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SANDBOX_ROOT="$DEVROOM_ROOT/sandboxes"
PROJECTS_ROOT="${DEVROOM_PROJECTS_ROOT:-$HOME/Desktop/Projects}"

CAP_APPS=(
  VaultCap PulseCap PrismCap SteadyCap LedgerCap DeePonyCap ScentCap AuraCap
)

mkdir -p "$SANDBOX_ROOT"

sync_one() {
  local name="$1"
  local src="$PROJECTS_ROOT/$name"
  local dest="$SANDBOX_ROOT/$name"
  if [[ ! -d "$src" ]]; then
    echo "⊘ skip $name (not found at $src)"
    return 0
  fi
  echo "↻ syncing $name → sandboxes/$name"
  rsync -a --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .next \
    --exclude dist \
    --exclude build \
    --exclude .DS_Store \
    --exclude '*.log' \
    "$src/" "$dest/"
  echo "✓ $name"
}

for app in "${CAP_APPS[@]}"; do
  sync_one "$app"
done

# Remove stale *OS sandbox folders if present
for legacy in FitnessOS StundsOS VaultOS PrismOS DisciplineOS DeePonyOS; do
  if [[ -d "$SANDBOX_ROOT/$legacy" ]]; then
    echo "🗑 removing stale sandbox $legacy"
    rm -rf "$SANDBOX_ROOT/$legacy"
  fi
done

echo ""
echo "Sandbox root: $SANDBOX_ROOT"
echo "Cap DevRoom — agents must ONLY write inside sandboxes/ — never $PROJECTS_ROOT"

mkdir -p "$DEVROOM_ROOT/data"
SYNC_ISO="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
python3 - <<PY
import json, os
meta = {
  "syncedAt": "$SYNC_ISO",
  "apps": $(printf '%s\n' "${CAP_APPS[@]}" | python3 -c 'import json,sys; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))'),
  "projectsRoot": "$PROJECTS_ROOT",
}
path = os.path.join("$DEVROOM_ROOT", "data", "sandbox-sync.json")
with open(path, "w") as f:
    json.dump(meta, f, indent=2)
print(f"📝 sync metadata → data/sandbox-sync.json")
PY
