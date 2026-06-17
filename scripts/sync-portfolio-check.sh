#!/usr/bin/env bash
# Compare Cap portfolio config between DevRoom and Markroom shared packages.
set -euo pipefail

DEVROOM="${DEVROOM_ROOT:-$HOME/Desktop/Cap-DevRoom}/packages/shared/src/capricorn-ecosystem.ts"
MARKROOM="${MARKROOM_ROOT:-$HOME/Desktop/Cap-Markroom}/packages/shared/src/capricorn-ecosystem.ts"

if [[ ! -f "$DEVROOM" ]]; then
  echo "Missing DevRoom ecosystem file: $DEVROOM"
  exit 1
fi

if [[ ! -f "$MARKROOM" ]]; then
  echo "Missing Markroom ecosystem file: $MARKROOM"
  echo "Set MARKROOM_ROOT if Markroom lives elsewhere."
  exit 1
fi

echo "Comparing portfolio config..."
echo "  DevRoom:  $DEVROOM"
echo "  Markroom: $MARKROOM"
echo

if diff -u "$DEVROOM" "$MARKROOM" >/tmp/cap-ecosystem.diff 2>&1; then
  echo "✓ capricorn-ecosystem.ts files are identical."
  exit 0
fi

echo "⚠ Drift detected — review diff:"
echo "---"
cat /tmp/cap-ecosystem.diff
echo "---"
echo "Update both repos manually or extract a shared @cap/ecosystem package later."
exit 1
