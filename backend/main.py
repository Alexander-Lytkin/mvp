from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

DATABASE_PATH = Path(__file__).resolve().parent / "likes.db"
DEEZER_SEARCH = "https://api.deezer.com/search"


def init_db() -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS likes (
                session_id TEXT NOT NULL,
                track_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (session_id, track_id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Music Search API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get("session_id")
        new_session = False
        if not session_id:
            session_id = str(uuid.uuid4())
            new_session = True
        request.state.session_id = session_id
        response = await call_next(request)
        if new_session:
            response.set_cookie(
                key="session_id",
                value=session_id,
                max_age=60 * 60 * 24 * 365,
                httponly=True,
                samesite="lax",
            )
        return response


app.add_middleware(SessionMiddleware)


class TrackOut(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: int
    preview: str | None
    cover: str | None
    deezer_url: str | None
    is_liked: bool = False


class SearchResponse(BaseModel):
    tracks: list[TrackOut]
    total: int | None = None


def _map_deezer_track(raw: dict, liked_ids: set[int]) -> TrackOut:
    artist = raw.get("artist") or {}
    album = raw.get("album") or {}
    cover = album.get("cover_medium") or album.get("cover_small")
    tid = int(raw["id"])
    return TrackOut(
        id=tid,
        title=raw.get("title") or "",
        artist=artist.get("name") or "",
        album=album.get("title") or "",
        duration=int(raw.get("duration") or 0),
        preview=raw.get("preview"),
        cover=cover,
        deezer_url=raw.get("link"),
        is_liked=tid in liked_ids,
    )


def get_liked_ids(session_id: str) -> set[int]:
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        rows = conn.execute(
            "SELECT track_id FROM likes WHERE session_id = ?", (session_id,)
        ).fetchall()
        return {int(r[0]) for r in rows}
    finally:
        conn.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/search", response_model=SearchResponse)
async def search_tracks(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(25, ge=1, le=50),
):
    session_id = request.state.session_id
    liked = get_liked_ids(session_id)

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            DEEZER_SEARCH,
            params={"q": q, "limit": limit},
        )
        r.raise_for_status()
        payload = r.json()

    if "error" in payload:
        err = payload["error"]
        detail = err.get("message", json.dumps(err)) if isinstance(err, dict) else str(err)
        raise HTTPException(status_code=502, detail=f"Deezer API: {detail}")

    data = payload.get("data") or []
    tracks = [_map_deezer_track(item, liked) for item in data]
    return SearchResponse(tracks=tracks, total=payload.get("total"))


@app.get("/api/likes", response_model=list[TrackOut])
async def list_likes(request: Request):
    session_id = request.state.session_id
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        rows = conn.execute(
            "SELECT track_id FROM likes WHERE session_id = ? ORDER BY created_at DESC",
            (session_id,),
        ).fetchall()
        ids = [int(r[0]) for r in rows]
    finally:
        conn.close()

    if not ids:
        return []

    liked = set(ids)
    tracks: list[TrackOut] = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for tid in ids:
            r = await client.get(f"https://api.deezer.com/track/{tid}")
            if r.status_code != 200:
                continue
            raw = r.json()
            if "error" in raw:
                continue
            tracks.append(_map_deezer_track(raw, liked))
    return tracks


@app.post("/api/likes/{track_id}")
async def like_track(request: Request, track_id: int):
    session_id = request.state.session_id
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"https://api.deezer.com/track/{track_id}")
        if r.status_code != 200:
            raise HTTPException(status_code=404, detail="Track not found on Deezer")
        raw = r.json()
        if "error" in raw:
            raise HTTPException(status_code=404, detail="Track not found on Deezer")

    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(
            "INSERT OR IGNORE INTO likes (session_id, track_id) VALUES (?, ?)",
            (session_id, track_id),
        )
        conn.commit()
    finally:
        conn.close()
    return {"ok": True, "track_id": track_id}


@app.delete("/api/likes/{track_id}")
async def unlike_track(request: Request, track_id: int):
    session_id = request.state.session_id
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(
            "DELETE FROM likes WHERE session_id = ? AND track_id = ?",
            (session_id, track_id),
        )
        conn.commit()
    finally:
        conn.close()
    return {"ok": True, "track_id": track_id}
