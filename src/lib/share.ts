import { COUNTS, DIFFICULTIES, MODES, type Difficulty, type Mode } from "@/lib/quiz";

/** Everything a shared result or challenge link carries. Lives in the URL — no backend. */
export type Challenge = {
  mode: Mode;
  difficulty: Difficulty;
  score: number;
  total: number;
  streak: number;
};

export const accuracy = (c: Pick<Challenge, "score" | "total">) =>
  c.total ? Math.round((c.score / c.total) * 100) : 0;

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
  return { mode, difficulty, score, total, streak };
}

export function challengeUrl(
  c: Challenge,
  origin = typeof window !== "undefined" ? window.location.origin : "",
) {
  const q = new URLSearchParams({
    mode: c.mode,
    difficulty: c.difficulty,
    score: String(c.score),
    total: String(c.total),
    streak: String(c.streak),
  });
  return `${origin}/challenge?${q}`;
}

/** Plain share-intent URLs — no SDKs or API keys. */
export function shareLinks(url: string, text: string) {
  const e = encodeURIComponent;
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
    x: `https://x.com/intent/tweet?text=${e(text)}&url=${e(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
  };
}
