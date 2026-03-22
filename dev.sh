#!/usr/bin/env bash
set -e

# Load .env.local so we can validate required vars before starting
if [ -f .env.local ]; then
  set -o allexport
  source .env.local
  set +o allexport
fi

# Validate required vars
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY is not set in .env.local"
  exit 1
fi

if [ -z "$ANKI_DB_PATH" ]; then
  echo "Error: ANKI_DB_PATH is not set in .env.local"
  exit 1
fi

ANKI_DB_PATH_EXPANDED="${ANKI_DB_PATH/#\~/$HOME}"
if [ ! -f "$ANKI_DB_PATH_EXPANDED" ]; then
  echo "Error: Anki collection not found at $ANKI_DB_PATH_EXPANDED"
  exit 1
fi

echo "→ Starting Anki service..."
ANKI_DB_PATH="$ANKI_DB_PATH_EXPANDED" docker compose up -d --build

echo "→ Starting Next.js..."
exec npm run dev
