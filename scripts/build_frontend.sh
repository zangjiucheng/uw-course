#!/usr/bin/env bash
# Build the React/Vite frontend and copy the output into the Flask package so
# `uw-course` (and the published PyPI wheel) serves the web UI directly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
STATIC="$ROOT/uw_course/web/static"

echo "==> Building frontend in $FRONTEND"
cd "$FRONTEND"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

echo "==> Syncing build output into $STATIC"
rm -rf "$STATIC"
mkdir -p "$STATIC"
cp -R "$FRONTEND/dist/." "$STATIC/"

echo "==> Done. uw_course/web/static now contains:"
ls -1 "$STATIC"
