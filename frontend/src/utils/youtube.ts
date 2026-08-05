// Extract a YouTube video ID from a watch link, short link or raw 11-char ID.
export function youTubeId(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  const m = v.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  return null;
}