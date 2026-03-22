"""
Anki Service — thin FastAPI wrapper around the anki Python package.

Provides REST endpoints for:
  GET  /health       — liveness check
  GET  /decks        — list all deck names
  POST /cards        — get due cards for a deck
  POST /answer       — submit a review answer (updates scheduling)
  POST /add-note     — add a new note to a deck
  POST /sync         — sync with AnkiWeb

The Anki collection path is read from the ANKI_DB_PATH environment variable.
"""

from __future__ import annotations

import os
import time
from contextlib import contextmanager
from typing import Any, Generator

from anki.collection import Collection
from anki.cards import Card
from anki.notes import Note
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

ANKI_DB_PATH = os.environ.get("ANKI_DB_PATH", "/data/collection.anki2")

app = FastAPI(title="Anki Service")


@contextmanager
def open_collection() -> Generator[Collection, None, None]:
    """Open the Anki collection as a context manager, closing it on exit."""
    if not os.path.exists(ANKI_DB_PATH):
        raise HTTPException(
            status_code=503,
            detail=f"Anki collection not found at {ANKI_DB_PATH}. "
            "Mount your collection.anki2 file into the container.",
        )
    try:
        col = Collection(ANKI_DB_PATH)
    except Exception as e:
        msg = str(e)
        if "already open" in msg or "media currently syncing" in msg:
            raise HTTPException(
                status_code=503,
                detail="Anki desktop is open and has locked the database. Close Anki and restart the service.",
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


class SyncRequest(BaseModel):
    username: str
    password: str


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
        # Find the deck
        deck = col.decks.by_name(req.deck_name)
        if deck is None:
            raise HTTPException(status_code=404, detail=f"Deck '{req.deck_name}' not found")

        # Get all due card IDs for this deck
        query = f'deck:"{req.deck_name}" is:due'
        due_ids = col.find_cards(query)
        total_due = len(due_ids)

        # Also include new cards
        new_query = f'deck:"{req.deck_name}" is:new'
        new_ids = col.find_cards(new_query)

        # Combine: due first, then new
        all_ids = list(due_ids) + [i for i in new_ids if i not in set(due_ids)]

        cards = []
        for card_id in all_ids:
            try:
                card = col.get_card(card_id)
                cards.append(card_to_dict(col, card))
            except Exception:
                continue

        return {"cards": cards, "totalDue": total_due}


@app.post("/answer")
def answer_card(req: AnswerRequest) -> dict[str, Any]:
    if req.ease not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="ease must be 1, 2, 3, or 4")

    with open_collection() as col:
        try:
            card = col.get_card(req.card_id)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Card {req.card_id} not found")

        # Use Anki's real scheduler to answer the card
        col.sched.answer_card(card, req.ease)

        # Return the updated card state
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

        # Use the Basic note type
        model = col.models.by_name("Basic")
        if model is None:
            # Fall back to first available model
            models = col.models.all()
            if not models:
                raise HTTPException(status_code=500, detail="No note types found")
            model = models[0]

        note = col.new_note(model)
        field_names = col.models.field_names(model)

        # Map front/back to the actual field names
        if len(field_names) >= 2:
            note.fields[0] = req.front
            note.fields[1] = req.back
        elif len(field_names) == 1:
            note.fields[0] = req.front

        if req.tags:
            note.tags = req.tags

        # Set the target deck
        note.note_type()["did"] = deck["id"]

        col.add_note(note, deck["id"])

        return {"noteId": note.id, "success": True}


@app.post("/sync")
def sync_collection(req: SyncRequest) -> dict[str, Any]:
    """Sync with AnkiWeb. Requires AnkiWeb username and password."""
    with open_collection() as col:
        try:
            # Authenticate and sync
            auth = col.sync_login(req.username, req.password)
            result = col.sync_collection(auth, False)
            return {"success": True, "result": str(result)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sync failed: {e}")
