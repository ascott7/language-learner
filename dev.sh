#!/usr/bin/env bash
set -e

# Load .env.local — values with spaces must be double-quoted in the file
# e.g. ANKI_DB_PATH="/path/with spaces/collection.anki2"
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
