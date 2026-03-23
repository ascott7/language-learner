"""
Anki Service — thin FastAPI wrapper around the anki Python package.

Provides REST endpoints for:
  GET  /health       — liveness check
  GET  /decks        — list all deck names
  POST /cards        — get due cards for a deck
  POST /answer       — submit a review answer (updates scheduling)
  POST /add-note     — add a new note to a deck
  POST /sync         — sync with AnkiWeb

On startup, if ANKIWEB_USERNAME and ANKIWEB_PASSWORD are set, the service
syncs the collection from AnkiWeb. If no local collection exists yet it is
created and a full download is performed.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager, contextmanager
from typing import Any, Generator

from anki.collection import Collection
from anki.cards import Card
from anki.notes import Note
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ANKI_DB_PATH = os.environ.get("ANKI_DB_PATH", "/data/collection.anki2")
ANKIWEB_USERNAME = os.environ.get("ANKIWEB_USERNAME", "")
ANKIWEB_PASSWORD = os.environ.get("ANKIWEB_PASSWORD", "")


# ─── Sync helpers ─────────────────────────────────────────────────────────────


def _sync_col(col: Collection) -> str:
    """Perform an incremental sync, falling back to full download if needed."""
    # endpoint=None uses the default AnkiWeb server; required positional in anki 25.x
    auth = col.sync_login(ANKIWEB_USERNAME, ANKIWEB_PASSWORD, None)
    out = col.sync_collection(auth, True)  # True = sync media
    # out.required: 0=no_changes, 1=normal_sync, 2=full_sync_needed
    required = getattr(out, "required", 0)
    logger.info("Sync result required=%s", required)
    if required == 2:
        # Full sync needed — download server version (correct for new collections)
        col.full_download(auth)
        return "full_download"
    return "incremental"


def _do_startup_sync() -> None:
    """Sync collection from AnkiWeb on service startup."""
    if not ANKIWEB_USERNAME or not ANKIWEB_PASSWORD:
        logger.info("No AnkiWeb credentials configured; skipping startup sync")
        return

    data_dir = os.path.dirname(os.path.abspath(ANKI_DB_PATH))
    os.makedirs(data_dir, exist_ok=True)

    logger.info("Syncing Anki collection from AnkiWeb...")
    try:
        col = Collection(ANKI_DB_PATH)
        try:
            action = _sync_col(col)
        finally:
            col.close()
        logger.info("Startup sync complete (action: %s)", action)
    except Exception as exc:
        logger.error("Startup sync failed: %s", exc)
        logger.info("Continuing with local collection (if present)")


# ─── FastAPI app ──────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    await asyncio.get_event_loop().run_in_executor(None, _do_startup_sync)
    yield


app = FastAPI(title="Anki Service", lifespan=lifespan)


@contextmanager
def open_collection() -> Generator[Collection, None, None]:
    """Open the Anki collection as a context manager, closing it on exit."""
    if not os.path.exists(ANKI_DB_PATH):
        raise HTTPException(
            status_code=503,
            detail=f"Anki collection not found at {ANKI_DB_PATH}. "
            "The service may still be syncing — try again in a moment.",
        )
    try:
        col = Collection(ANKI_DB_PATH)
    except Exception as e:
        msg = str(e)
        if "already open" in msg or "media currently syncing" in msg:
            raise HTTPException(
                status_code=503,
                detail="Anki collection is locked. If Anki desktop is open, close it.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to open collection: {msg}")
    try:
        yield col
    finally:
        col.close()


# ─── Request / Response Models ────────────────────────────────────────────────


class CardsRequest(BaseModel):
    deck_name: str


class AnswerRequest(BaseModel):
    card_id: int
    ease: int  # 1=Again, 2=Hard, 3=Good, 4=Easy


class AddNoteRequest(BaseModel):
    deck_name: str
    front: str
    back: str
    tags: list[str] = []


# ─── Helpers ──────────────────────────────────────────────────────────────────


def card_to_dict(col: Collection, card: Card) -> dict[str, Any]:
    """Serialize a Card + its Note to a JSON-compatible dict."""
    note = col.get_note(card.nid)
    model = col.models.get(note.mid)
    field_names: list[str] = col.models.field_names(model) if model else []

    fields: dict[str, dict[str, Any]] = {}
    for i, value in enumerate(note.fields):
        name = field_names[i] if i < len(field_names) else str(i)
        fields[name] = {"value": value, "order": i}

    return {
        "cardId": card.id,
        "noteId": note.id,
        "deckName": col.decks.name(card.did),
        "fields": fields,
        "interval": card.ivl,
        "ease": card.factor,
        "type": card.type,
        "due": card.due,
        "reps": card.reps,
        "lapses": card.lapses,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────


@app.get("/health")
def health() -> dict[str, Any]:
    if not os.path.exists(ANKI_DB_PATH):
        return {"status": "error", "message": f"Collection not found: {ANKI_DB_PATH}"}
    return {"status": "ok", "collection": ANKI_DB_PATH}


@app.get("/decks")
def list_decks() -> dict[str, Any]:
    with open_collection() as col:
        names = [d["name"] for d in col.decks.all() if d["id"] != 1]
        return {"decks": sorted(names)}


@app.post("/cards")
def get_due_cards(req: CardsRequest) -> dict[str, Any]:
    with open_collection() as col:
        deck = col.decks.by_name(req.deck_name)
        if deck is None:
            raise HTTPException(status_code=404, detail=f"Deck '{req.deck_name}' not found")

        due_ids = col.find_cards(f'deck:"{req.deck_name}" is:due')
        total_due = len(due_ids)
        rated_today = len(col.find_cards(f'deck:"{req.deck_name}" rated:1'))
        new_ids = col.find_cards(f'deck:"{req.deck_name}" is:new')

        all_ids = list(due_ids) + [i for i in new_ids if i not in set(due_ids)]

        cards = []
        for card_id in all_ids:
            try:
                card = col.get_card(card_id)
                cards.append(card_to_dict(col, card))
            except Exception:
                continue

        return {"cards": cards, "totalDue": total_due, "ratedToday": rated_today}


@app.post("/answer")
def answer_card(req: AnswerRequest) -> dict[str, Any]:
    if req.ease not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="ease must be 1, 2, 3, or 4")

    with open_collection() as col:
        try:
            card = col.get_card(req.card_id)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Card {req.card_id} not found")

        try:
            col.reset()
            card.start_timer()
            col.sched.answer_card(card, req.ease)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to answer card: {e}")

        updated_card = col.get_card(req.card_id)
        return {
            "success": True,
            "cardId": req.card_id,
            "newInterval": updated_card.ivl,
            "newEase": updated_card.factor,
            "newDue": updated_card.due,
        }


@app.post("/add-note")
def add_note(req: AddNoteRequest) -> dict[str, Any]:
    with open_collection() as col:
        deck = col.decks.by_name(req.deck_name)
        if deck is None:
            raise HTTPException(status_code=404, detail=f"Deck '{req.deck_name}' not found")

        model = col.models.by_name("Basic")
        if model is None:
            models = col.models.all()
            if not models:
                raise HTTPException(status_code=500, detail="No note types found")
            model = models[0]

        note = col.new_note(model)
        field_names = col.models.field_names(model)

        if len(field_names) >= 2:
            note.fields[0] = req.front
            note.fields[1] = req.back
        elif len(field_names) == 1:
            note.fields[0] = req.front

        if req.tags:
            note.tags = req.tags

        note.note_type()["did"] = deck["id"]
        col.add_note(note, deck["id"])

        return {"noteId": note.id, "success": True}


@app.post("/sync")
def sync_endpoint() -> dict[str, Any]:
    """Sync with AnkiWeb using credentials from environment variables."""
    if not ANKIWEB_USERNAME or not ANKIWEB_PASSWORD:
        raise HTTPException(
            status_code=400,
            detail="ANKIWEB_USERNAME and ANKIWEB_PASSWORD must be set in environment",
        )
    with open_collection() as col:
        try:
            action = _sync_col(col)
            return {"success": True, "action": action}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sync failed: {e}")
