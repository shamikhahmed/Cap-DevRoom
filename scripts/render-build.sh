#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm ci
bash scripts/rebuild-packages.sh
npm run db:push
npm run build -w @cap/devroom-dashboard
