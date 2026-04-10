"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { Track } from "@/lib/api";
import { likeTrack, unlikeTrack } from "@/lib/api";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  track: Track;
  onLikeChange?: (id: number, liked: boolean) => void;
};

let activeAudio: HTMLAudioElement | null = null;

export function TrackCard({ track, onLikeChange }: Props) {
  const [liked, setLiked] = useState(track.is_liked);
  const [pending, setPending] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function toggleLike() {
    if (pending) return;
    setPending(true);
    const next = !liked;
    try {
      if (next) {
        await likeTrack(track.id);
      } else {
        await unlikeTrack(track.id);
      }
      setLiked(next);
      onLikeChange?.(track.id, next);
    } catch {
      setLiked(liked);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    return () => {
      if (activeAudio === audioRef.current) {
        activeAudio = null;
      }
    };
  }, []);

  function handlePlay(event: SyntheticEvent<HTMLAudioElement>) {
    const current = event.currentTarget;
    if (activeAudio && activeAudio !== current) {
      activeAudio.pause();
    }
    activeAudio = current;
  }

  function handleStop(event: SyntheticEvent<HTMLAudioElement>) {
    if (activeAudio === event.currentTarget) {
      activeAudio = null;
    }
  }

  return (
    <article className="group flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-pink-500/40">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-black/40">
        {track.cover ? (
          <Image
            src={track.cover}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
            ?
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-[var(--foreground)]">{track.title}</h3>
        <p className="truncate text-sm text-[var(--muted)]">{track.artist}</p>
        <p className="truncate text-xs text-[var(--muted)]/80">{track.album}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-xs tabular-nums text-[var(--muted)]">
            {formatDuration(track.duration)}
          </span>
          {track.preview ? (
            <audio
              ref={audioRef}
              controls
              src={track.preview}
              onPlay={handlePlay}
              onPause={handleStop}
              onEnded={handleStop}
              className="h-7 max-w-[200px] sm:max-w-[280px]"
            />
          ) : null}
          {track.deezer_url ? (
            <a
              href={track.deezer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-400 underline-offset-4 hover:underline"
            >
              Deezer
            </a>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? "Убрать из избранного" : "В избранное"}
        className="shrink-0 self-start rounded-lg p-2 text-2xl leading-none transition enabled:hover:bg-white/5 disabled:opacity-50"
      >
        {liked ? "♥" : "♡"}
      </button>
    </article>
  );
}
