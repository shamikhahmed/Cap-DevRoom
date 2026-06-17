#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/dashboard"

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local — add CURSOR_API_KEY from cursor.com/dashboard/integrations"
fi

lsof -ti :3000 | xargs kill -9 2>/dev/null || true

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)

echo ""
echo "  Cap DevRoom"
echo "  ─────────────────────────────────────"
echo "  Mac:     http://127.0.0.1:3000"
if [[ -n "$LAN_IP" ]]; then
  echo "  iPhone:  http://${LAN_IP}:3000  (same Wi‑Fi)"
  echo "  Add to Home Screen from Safari ↑"
else
  echo "  iPhone:  connect Mac + iPhone to same Wi‑Fi, then check Settings → iPhone"
fi
echo "  ─────────────────────────────────────"
echo ""

exec npm run dev
