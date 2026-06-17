#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build -w @cap/devroom-shared
npm run build -w @cap/devroom-database
