#!/usr/bin/env bash
# Cap DevRoom preflight — env, packages, sandboxes, health
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Cap · DevRoom — Doctor"
echo "──────────────────────"

fail=0

check() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $label"
  else
    echo -e "${RED}✗${NC} $label"
    fail=1
  fi
}

check "Root package.json" "test -f package.json"
check "Turbo config" "test -f turbo.json"
check "Dashboard app" "test -d dashboard"
check "Env template" "test -f dashboard/.env.example"
check "Shared package source" "test -f packages/shared/src/index.ts"
check "Shared dist" "test -f packages/shared/dist/index.js"
check "Env: dashboard/.env.local or .env" "test -f dashboard/.env.local || test -f dashboard/.env"

if [[ -f dashboard/.env.local ]]; then
  if grep -qE '^CURSOR_API_KEY=.+' dashboard/.env.local 2>/dev/null; then
    echo -e "${GREEN}✓${NC} CURSOR_API_KEY in .env.local"
  else
    echo -e "${YELLOW}!${NC} CURSOR_API_KEY empty in .env.local (agents won't run)"
  fi
elif [[ -n "${CURSOR_API_KEY:-}" ]]; then
  echo -e "${GREEN}✓${NC} CURSOR_API_KEY in shell"
else
  echo -e "${YELLOW}!${NC} CURSOR_API_KEY not configured"
fi

echo ""
echo "Sandboxes:"
for app in VaultCap PulseCap PrismCap SteadyCap LedgerCap DeePonyCap ScentCap AuraCap; do
  if [[ -d "$ROOT/sandboxes/$app" ]]; then
    echo -e "  ${GREEN}✓${NC} $app"
  else
    echo -e "  ${RED}✗${NC} $app — run npm run sync:sandboxes"
    fail=1
  fi
done

# Version consistency
ROOT_VER=$(node -pe "require('$ROOT/package.json').version" 2>/dev/null || echo "?")
SHARED_VER=$(node -pe "require('$ROOT/packages/shared/package.json').version" 2>/dev/null || echo "?")
if [[ "$ROOT_VER" == "$SHARED_VER" ]]; then
  echo -e "${GREEN}✓${NC} Version sync root/shared: v$ROOT_VER"
else
  echo -e "${YELLOW}!${NC} Version mismatch root=$ROOT_VER shared=$SHARED_VER"
fi

if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Dashboard health http://localhost:3000/api/health"
else
  echo -e "${YELLOW}!${NC} Dashboard not running on :3000 (start with npm run dev:stack)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo -e "${YELLOW}Fix:${NC}"
  echo "  cd $ROOT"
  echo "  npm install && npm run rebuild:packages"
  echo "  cp dashboard/.env.example dashboard/.env.local"
  echo "  npm run sync:sandboxes"
  echo "  npm run dev:stack"
  exit 1
fi

echo ""
echo -e "${GREEN}All checks passed.${NC}"
