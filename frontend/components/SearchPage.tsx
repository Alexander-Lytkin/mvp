"use client";

import { useCallback, useState } from "react";
import type { Track } from "@/lib/api";
import { fetchLikedTracks, searchTracks } from "@/lib/api";
import { TrackCard } from "@/components/TrackCard";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [likedOnly, setLikedOnly] = useState<Track[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"search" | "likes">("search");

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setTab("search");
    try {
      const res = await searchTracks(q);
      setTracks(res.tracks);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
      setTracks([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadLikes = useCallback(async () => {
    setLikesLoading(true);
    setError(null);
    try {
      const list = await fetchLikedTracks();
      setLikedOnly(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить избранное");
      setLikedOnly([]);
    } finally {
      setLikesLoading(false);
    }
  }, []);

  const onLikeChange = useCallback((id: number, liked: boolean) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, is_liked: liked } : t)));
    setLikedOnly((prev) => {
      if (!liked) return prev.filter((t) => t.id !== id);
      const existing = prev.find((t) => t.id === id);
      if (existing) return prev.map((t) => (t.id === id ? { ...t, is_liked: true } : t));
      const fromSearch = tracks.find((t) => t.id === id);
      if (fromSearch) return [{ ...fromSearch, is_liked: true }, ...prev];
      return prev;
    });
  }, [tracks]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
          Поиск музыки
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Deezer API · сохранение лайков в сессии</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Исполнитель, трек, альбом…"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none ring-pink-500/30 placeholder:text-[var(--muted)] focus:border-pink-500/50 focus:ring-2"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 px-6 py-3 font-medium text-white shadow-lg shadow-pink-900/30 transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Поиск…" : "Найти"}
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "search"
              ? "border-pink-500 text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Результаты
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("likes");
            void loadLikes();
          }}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "likes"
              ? "border-pink-500 text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Избранное
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {tab === "search" ? (
        <>
          {total != null && tracks.length > 0 ? (
            <p className="mb-4 text-sm text-[var(--muted)]">Найдено в каталоге: {total}</p>
          ) : null}
          <ul className="flex flex-col gap-3">
            {tracks.map((t) => (
              <li key={t.id}>
                <TrackCard track={t} onLikeChange={onLikeChange} />
              </li>
            ))}
          </ul>
          {!loading && tracks.length === 0 && query.trim() ? (
            <p className="text-center text-[var(--muted)]">Ничего не найдено. Попробуйте другой запрос.</p>
          ) : null}
          {!query.trim() && tracks.length === 0 ? (
            <p className="text-center text-[var(--muted)]">Введите запрос и нажмите «Найти».</p>
          ) : null}
        </>
      ) : (
        <>
          {likesLoading ? (
            <p className="text-[var(--muted)]">Загрузка избранного…</p>
          ) : likedOnly.length === 0 ? (
            <p className="text-center text-[var(--muted)]">Пока нет избранных треков.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {likedOnly.map((t) => (
                <li key={t.id}>
                  <TrackCard track={{ ...t, is_liked: true }} onLikeChange={(id, liked) => {
                    onLikeChange(id, liked);
                    if (!liked) {
                      setLikedOnly((p) => p.filter((x) => x.id !== id));
                    }
                  }} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
