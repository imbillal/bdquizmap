import { DISTRICTS, DIVISIONS, type District } from "@/data/districts";

export type Mode = "district" | "division" | "find";
export type Difficulty = "easy" | "medium" | "hard";
export type Settings = { mode: Mode; difficulty: Difficulty; count: 5 | 10 | 20 };

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "district", label: "Identify District", hint: "Name the highlighted district" },
  { id: "division", label: "Identify Division", hint: "Which division is it in?" },
  { id: "find", label: "Find District", hint: "Tap it on the map" },
];
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const COUNTS = [5, 10, 20] as const;
export const QUESTION_SECONDS = 15;

export const byId = new Map(DISTRICTS.map((d) => [d.id, d]));

export type Question = {
  district: District;
  mode: Mode;
  choices: string[];
  answer: string;
};

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const dist = (a: District, b: District) => Math.hypot(a.cx - b.cx, a.cy - b.cy);

export function nearest(d: District, n: number): District[] {
  return DISTRICTS.filter((x) => x.id !== d.id)
    .sort((a, b) => dist(a, d) - dist(b, d))
    .slice(0, n);
}

/** Pick the round's districts with no repeats. Easy favours larger regions. */
export function pickDistricts(count: number, difficulty: Difficulty, firstId?: string): District[] {
  let pool = [...DISTRICTS];
  if (difficulty === "easy") {
    pool = [...pool].sort((a, b) => b.area - a.area).slice(0, Math.max(count, 40));
  }
  let picked = shuffle(pool).slice(0, count);
  const first = firstId ? byId.get(firstId) : undefined;
  if (first) picked = [first, ...picked.filter((d) => d.id !== first.id)].slice(0, count);
  return picked;
}

function districtChoices(d: District, difficulty: Difficulty): string[] {
  let wrong: District[];
  if (difficulty === "hard") wrong = nearest(d, 3);
  else if (difficulty === "medium") wrong = shuffle(nearest(d, 9)).slice(0, 3);
  else wrong = shuffle(DISTRICTS.filter((x) => x.division !== d.division)).slice(0, 3);
  return shuffle([d.name, ...wrong.map((w) => w.name)]);
}

function divisionChoices(d: District, difficulty: Difficulty): string[] {
  const near =
    difficulty === "easy"
      ? []
      : [...new Set(nearest(d, 12).map((x) => x.division))].filter((v) => v !== d.division);
  const rest = shuffle(DIVISIONS.filter((v) => v !== d.division && !near.includes(v)));
  return shuffle([d.division, ...[...near, ...rest].slice(0, 3)]);
}

export function generateDistrictQuestion(d: District, difficulty: Difficulty): Question {
  return { district: d, mode: "district", answer: d.name, choices: districtChoices(d, difficulty) };
}
export function generateDivisionQuestion(d: District, difficulty: Difficulty): Question {
  return { district: d, mode: "division", answer: d.division, choices: divisionChoices(d, difficulty) };
}
export function generateMapQuestion(d: District): Question {
  return { district: d, mode: "find", answer: d.id, choices: [] };
}

export function buildRound(s: Settings, firstId?: string): Question[] {
  return pickDistricts(s.count, s.difficulty, firstId).map((d) =>
    s.mode === "district"
      ? generateDistrictQuestion(d, s.difficulty)
      : s.mode === "division"
        ? generateDivisionQuestion(d, s.difficulty)
        : generateMapQuestion(d),
  );
}

export const streakBonus = (s: number) => (s >= 5 ? 50 : s === 4 ? 30 : s === 3 ? 20 : s === 2 ? 10 : 0);
export const speedBonus = (left: number) => Math.round((50 * Math.max(0, left)) / QUESTION_SECONDS);

export function rating(pct: number) {
  if (pct >= 90) return "Bangladesh Geography Master";
  if (pct >= 70) return "You Know Bangladesh Well";
  if (pct >= 50) return "Getting There";
  return "Time to Explore Bangladesh";
}

/* ---------- Persistence (browser only) ---------- */
export type Stats = {
  bestScore: number;
  bestAccuracy: number;
  bestStreak: number;
  gamesPlayed: number;
  districtsCorrect: number;
  totalAnswered: number;
};
const STATS_KEY = "bqm-stats";
const SETTINGS_KEY = "bqm-settings";
export const emptyStats: Stats = {
  bestScore: 0,
  bestAccuracy: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  districtsCorrect: 0,
  totalAnswered: 0,
};

export function loadStats(): Stats {
  try {
    return { ...emptyStats, ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}") };
  } catch {
    return emptyStats;
  }
}
export function recordGame(r: { score: number; correct: number; total: number; bestStreak: number }) {
  const s = loadStats();
  const acc = r.total ? Math.round((r.correct / r.total) * 100) : 0;
  const next: Stats = {
    bestScore: Math.max(s.bestScore, r.score),
    bestAccuracy: Math.max(s.bestAccuracy, acc),
    bestStreak: Math.max(s.bestStreak, r.bestStreak),
    gamesPlayed: s.gamesPlayed + 1,
    districtsCorrect: s.districtsCorrect + r.correct,
    totalAnswered: s.totalAnswered + r.total,
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return { stats: next, newBest: r.score > s.bestScore && s.gamesPlayed > 0 };
}

export function loadSettings(): Partial<Settings> {
  try {
    return JSON.parse(sessionStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}
export function saveSettings(s: Settings) {
  try {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
