#!/usr/bin/env bash
# One-command local dev stack: shared packages → dashboard :3000
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}Cap · DevRoom — Dev Stack${NC}"
echo "────────────────────────────────"

if [[ ! -f dashboard/.env.local ]] && [[ ! -f dashboard/.env ]]; then
  if [[ -f dashboard/.env.example ]]; then
    echo -e "${YELLOW}! No dashboard/.env.local — copy dashboard/.env.example and add CURSOR_API_KEY${NC}"
  else
    echo -e "${RED}✗ Missing dashboard/.env.example${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Env file present${NC}"
fi

echo -e "${YELLOW}→ Checking workspace packages...${NC}"
bash scripts/ensure-packages-built.sh

if [[ -f packages/database/.env ]] || [[ -n "${DATABASE_URL:-}" ]] || [[ -f dashboard/.env.local ]]; then
  echo -e "${YELLOW}→ Syncing database schema...${NC}"
  npm run db:push --silent 2>/dev/null || echo -e "${YELLOW}  (db:push skipped — run npm run db:push manually)${NC}"
fi

if [[ -d sandboxes/VaultCap ]]; then
  echo -e "${GREEN}✓ Sandboxes present${NC}"
else
  echo -e "${YELLOW}! Run npm run sync:sandboxes to pull portfolio apps${NC}"
fi

echo -e "${YELLOW}Tip:${NC} Set DEVROOM_HEARTBEAT=1 in dashboard/.env.local to auto-run scheduled crews in dev"
echo -e "${YELLOW}Tip:${NC} npm run devroom:bootstrap after first start (free readiness scan)"

echo ""
echo -e "${GREEN}Starting dashboard:${NC}"
echo "  DevRoom → http://localhost:3000"
echo "  Health  → http://localhost:3000/api/health"
echo ""

exec npm run dev -w @cap/devroom-dashboard
