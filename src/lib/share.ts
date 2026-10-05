import { DISTRICTS } from "@/data/districts";
import type { Lang } from "@/lib/i18n";
import { COUNTS, DIFFICULTIES, MODES, type Difficulty, type Mode } from "@/lib/quiz";

/** Everything a shared result or challenge link carries. Lives in the URL — no backend. */
export type Challenge = {
  mode: Mode;
  difficulty: Difficulty;
  score: number;
  total: number;
  streak: number;
  /** District ids answered correctly / incorrectly, drawn on the share image's map. */
  hits: string[];
  misses: string[];
  lang: Lang;
};

export const accuracy = (c: Pick<Challenge, "score" | "total">) =>
  c.total ? Math.round((c.score / c.total) * 100) : 0;

// One URL-safe character per district: its index in DISTRICTS.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const encodeIds = (ids: string[]) =>
  ids.map((id) => ALPHABET[DISTRICTS.findIndex((d) => d.id === id)] ?? "").join("");
const decodeIds = (v: unknown, max: number) =>
  typeof v === "string"
    ? [...new Set([...v].map((ch) => DISTRICTS[ALPHABET.indexOf(ch)]?.id).filter(Boolean))]
        .slice(0, max)
        .map(String)
    : [];

const int = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

/** Parse untrusted search params into a valid challenge, or undefined. */
export function parseChallenge(s: Record<string, unknown>): Challenge | undefined {
  const mode = MODES.find((m) => m.id === s.mode)?.id;
  const total = COUNTS.find((c) => c === int(s.total));
  const score = int(s.score);
  if (!mode || !total || score === undefined || score < 0 || score > total) return undefined;
  const difficulty = DIFFICULTIES.includes(s.difficulty as Difficulty)
    ? (s.difficulty as Difficulty)
    : "medium";
  const streak = Math.min(total, Math.max(0, int(s.streak) ?? 0));
  const hits = decodeIds(s.c, total);
  const misses = decodeIds(s.w, total).filter((id) => !hits.includes(id));
  const lang: Lang = s.l === "en" ? "en" : "bn";
  return { mode, difficulty, score, total, streak, hits, misses, lang };
}

function challengeParams(c: Challenge) {
  const q = new URLSearchParams({
    mode: c.mode,
    difficulty: c.difficulty,
    score: String(c.score),
    total: String(c.total),
    streak: String(c.streak),
  });
  if (c.hits.length) q.set("c", encodeIds(c.hits));
  if (c.misses.length) q.set("w", encodeIds(c.misses));
  if (c.lang !== "bn") q.set("l", c.lang);
  return q;
}

const currentOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");

export const challengeUrl = (c: Challenge, origin = currentOrigin()) =>
  `${origin}/challenge?${challengeParams(c)}`;

/** Link-preview image for a challenge, rendered by /api/og. */
export const ogImageUrl = (c: Challenge, origin = currentOrigin()) =>
  `${origin}/api/og?${challengeParams(c)}`;

/** Plain share-intent URLs — no SDKs or API keys. */
export function shareLinks(url: string, text: string) {
  const e = encodeURIComponent;
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
    x: `https://x.com/intent/tweet?text=${e(text)}&url=${e(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
  };
}
