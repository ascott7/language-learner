# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

IMPORTANT: always create commits for your work. When working on a multi-task plan, create commits for the individual tasks in the plan.

## Project Overview

**language-learner** — LLM-powered language learning via Anki-integrated story generation. Pulls due Anki flashcards, generates a story incorporating those words (Claude API), highlights flashcard words in the story for inline comprehension rating, and syncs results back to Anki. Tracks grade-level progress over time.

Primary use case: Korean, but language-agnostic by design.

## Development Setup

### Prerequisites
- Node.js + npm
- Docker (for the Python Anki service)
- An Anki collection file (`.anki2`)
- Anthropic API key

### Required environment variables (copy `.env.local.example` → `.env.local`)
```
ANTHROPIC_API_KEY=sk-ant-...
ANKI_DB_PATH=~/Library/Application Support/Anki2/User 1/collection.anki2
```

## Commands

```bash
# Start everything (Anki Docker service + Next.js dev server)
./dev.sh              # → http://localhost:3000

# Type checking
npm run typecheck     # tsc --noEmit (strict mode)

# Linting
npm run lint          # next lint

# Build for production
npm run build
```

## Architecture

```
Browser (React/Next.js)
    ↓
Next.js API Routes (src/app/api/)
    ├── /api/anki/*      → proxies to Python Anki service (localhost:5000)
    ├── /api/story/*     → Claude API (generation, translation, feedback)
    ├── /api/progress    → Drizzle/SQLite session history
    └── /api/settings    → app settings persistence

Python Anki Service (anki-service/ — Docker)
    └── FastAPI wrapping anki Python package
        Provides: deck listing, due cards, card scheduling (real SM-2), add note, AnkiWeb sync

App Database (data/language-learner.db — SQLite via Drizzle ORM)
    └── sessions, level_history, settings tables
        Drizzle supports SQLite now, PostgreSQL later (change driver + connection config)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All shared TypeScript types — start here |
| `src/lib/claude-client.ts` | Claude API calls (story generation, translation, word lookup) |
| `src/lib/story-parser.ts` | Parses/verifies Claude's structured story output; critical for correct word highlighting |
| `src/lib/anki-service-client.ts` | HTTP client for the Python Anki service |
| `src/lib/level-tracker.ts` | Grade level tracking and adjustment logic |
| `src/stores/session-store.ts` | Zustand store — all client session state |
| `src/lib/db/schema.ts` | Drizzle ORM schema |
| `anki-service/main.py` | Python FastAPI service wrapping the `anki` package |

## UX Flow

1. **Home** (`/`) — select Anki deck → "Generate Story"
2. **Session** (`/session`) — story generation spinner → story reading
3. **Reading** — tap highlighted word → popover with definition + 4-button Anki rating (Again/Hard/Good/Easy). Tap non-highlighted word → add to deck flow.
4. **Feedback** — rate story difficulty (Too Easy / About Right / Too Hard) → adjusts grade level
5. **Summary** — rating breakdown, level change, "Study More"
6. **Progress** (`/progress`) — session history, level chart

## Anki DB Notes

The Python service bind-mounts `collection.anki2` from the host into the Docker container. Do not open Anki desktop while the service is running (SQLite concurrent write risk).

## Future Cloud Deployment

- Replace SQLite with PostgreSQL: update `drizzle.config.ts` dialect and `src/lib/db/index.ts` driver, run `drizzle-kit migrate`
- Anki sync: options include file upload of `.apkg` exports, or exposing AnkiConnect from the user's machine
