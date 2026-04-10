export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  preview: string | null;
  cover: string | null;
  deezer_url: string | null;
  is_liked: boolean;
};

const API_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL === "string"
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "http://localhost:8000";

function credFetch(input: string, init?: RequestInit) {
  return fetch(input, {
    ...init,
    credentials: "include"
  });
}

export async function searchTracks(q: string): Promise<{ tracks: Track[]; total: number | null }> {
  const params = new URLSearchParams({ q });
  const r = await credFetch(`${API_BASE}/api/search?${params}`);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json();
}

export async function fetchLikedTracks(): Promise<Track[]> {
  const r = await credFetch(`${API_BASE}/api/likes`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function likeTrack(trackId: number): Promise<void> {
  const r = await credFetch(`${API_BASE}/api/likes/${trackId}`, { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
}

export async function unlikeTrack(trackId: number): Promise<void> {
  const r = await credFetch(`${API_BASE}/api/likes/${trackId}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}
