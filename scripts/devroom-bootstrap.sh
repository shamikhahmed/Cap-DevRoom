#!/usr/bin/env bash
# Bootstrap DevRoom office: free readiness scan + activity (no LLM cost)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Cap · DevRoom — bootstrap"
curl -sf -X POST "http://localhost:3000/api/bootstrap" || {
  echo "Start dashboard first: npm run dev"
  exit 1
}
echo ""
echo "Done. Open http://localhost:3000 for activity + portfolio scores."
