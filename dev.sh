#!/usr/bin/env bash
set -e

# Load .env.local — values with spaces must be double-quoted in the file
if [ -f .env.local ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env.local || {
    echo "Error: Failed to parse .env.local — check that values containing spaces are double-quoted"
    exit 1
  }
  set +o allexport
else
  echo "Error: .env.local not found. Copy .env.local.example and fill in the values."
  exit 1
fi

# Validate required vars
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY is not set in .env.local"
  exit 1
fi

if [ -z "$ANKIWEB_USERNAME" ]; then
  echo "Error: ANKIWEB_USERNAME is not set in .env.local"
  exit 1
fi

if [ -z "$ANKIWEB_PASSWORD" ]; then
  echo "Error: ANKIWEB_PASSWORD is not set in .env.local"
  exit 1
fi

# ─── Find a free port for the Anki service (prefer 5001, avoid macOS 5000) ────
find_free_port() {
  local start=${1:-5001}
  python3 -c "
import socket
for port in range(${start}, ${start} + 100):
    try:
        s = socket.socket()
        s.bind(('', port))
        s.close()
        print(port)
        break
    except OSError:
        continue
"
}
export ANKI_SERVICE_PORT
ANKI_SERVICE_PORT=$(find_free_port 5001)
export ANKI_SERVICE_URL="http://localhost:${ANKI_SERVICE_PORT}"
echo "→ Anki service will use port ${ANKI_SERVICE_PORT}"

# ─── Start Anki service ───────────────────────────────────────────────────────
echo "→ Starting Anki service (will sync from AnkiWeb on startup)..."
docker compose up -d --build --force-recreate

# ─── Start Next.js (ANKI_SERVICE_URL is already exported above) ───────────────
echo "→ Starting Next.js at http://localhost:3000"
exec npm run dev
