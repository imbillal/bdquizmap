import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Flame, RotateCcw, Timer, Trophy, X } from "lucide-react";
import { BangladeshMap, type DistrictState } from "@/components/BangladeshMap";
import { ResultCardPreview } from "@/components/ResultCard";
import { ShareButtons } from "@/components/ShareButtons";
import { DISTRICTS } from "@/data/districts";
import {
  buildRound,
  byId,
  COUNTS,
  DIFFICULTIES,
  loadSettings,
  MODES,
  QUESTION_SECONDS,
  recordGame,
  saveSettings,
  speedBonus,
  streakBonus,
  type Difficulty,
  type Mode,
  type Question,
  type Settings,
} from "@/lib/quiz";
import { useLang } from "@/lib/i18n";
import { type Challenge } from "@/lib/share";
import { cn } from "@/lib/utils";

type Search = { mode?: Mode; difficulty?: Difficulty; count?: number; district?: string; start?: boolean };

export const Route = createFileRoute("/quiz")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: MODES.some((m) => m.id === s.mode) ? (s.mode as Mode) : undefined,
    difficulty: DIFFICULTIES.includes(s.difficulty as Difficulty) ? (s.difficulty as Difficulty) : undefined,
    count: typeof s.count === "number" ? s.count : undefined,
    district: typeof s.district === "string" ? s.district : undefined,
    start: s.start === true || s.start === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "কুইজ খেলুন — বাংলাদেশ কুইজ ম্যাপ" },
      { name: "description", content: "বাংলাদেশের ম্যাপে জেলা চিনুন, বিভাগ বলুন, অথবা জায়গা খুঁজে বের করুন। নিজের সেরা স্কোর ভাঙুন।" },
      { property: "og:title", content: "বাংলাদেশ কুইজ ম্যাপ খেলুন" },
      { property: "og:description", content: "বাংলাদেশের ৬৪টি জেলা কি আপনি চিনতে পারবেন?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

type Answer = { id: string; correct: boolean };
type Result = { score: number; answers: Answer[]; bestStreak: number; settings: Settings };

function QuizPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/quiz" });
  const [settings, setSettings] = useState<Settings>({ mode: "district", difficulty: "medium", count: 10 });
  const [phase, setPhase] = useState<"setup" | "play" | "results">("setup");
  const [round, setRound] = useState<Question[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const started = useRef(false);

  // Restore settings: URL first, then session memory
  useEffect(() => {
    const saved = loadSettings();
    const count = COUNTS.find((c) => c === (search.count ?? saved.count)) ?? 10;
    const next: Settings = {
      mode: search.mode ?? saved.mode ?? "district",
      difficulty: search.difficulty ?? saved.difficulty ?? "medium",
      count,
    };
    setSettings(next);
    if (search.start && !started.current) {
      started.current = true;
      begin(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.mode, search.difficulty, search.count]);

  const begin = (s: Settings) => {
    saveSettings(s);
    const first = DISTRICTS.find((d) => d.slug === search.district)?.id;
    setRound(buildRound(s, first));
    setResult(null);
    setPhase("play");
  };

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    navigate({ search: { mode: next.mode, difficulty: next.difficulty, count: next.count }, replace: true });
  };

  return (
    <div className="py-6">
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Setup settings={settings} update={update} onStart={() => begin(settings)} />
          </motion.div>
        )}
        {phase === "play" && round.length > 0 && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Game
              key={round.map((q) => q.district.id).join()}
              round={round}
              settings={settings}
              onQuit={() => setPhase("setup")}
              onDone={(r) => {
                setResult({ ...r, settings });
                setPhase("results");
              }}
            />
          </motion.div>
        )}
        {phase === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Results result={result} onAgain={() => begin(settings)} onSetup={() => setPhase("setup")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Setup ---------------- */

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  render,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  render?: (v: T) => React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</legend>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={String(o)}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize transition",
              value === o ? "border-accent bg-accent text-accent-foreground" : "bg-secondary hover:bg-muted",
            )}
          >
            {render ? render(o) : o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Setup({
  settings,
  update,
  onStart,
}: {
  settings: Settings;
  update: (p: Partial<Settings>) => void;
  onStart: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-xl rounded-3xl border bg-card p-6 shadow-card md:p-8">
      <h1 className="text-3xl font-extrabold">{t.setupTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.setupSub}</p>

      <fieldset className="mt-6">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.quizMode}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              aria-pressed={settings.mode === m.id}
              onClick={() => update({ mode: m.id })}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                settings.mode === m.id ? "border-accent bg-accent text-accent-foreground" : "bg-secondary hover:bg-muted",
              )}
            >
              <div className="text-sm font-bold">{t.modes[m.id].label}</div>
              <div className={cn("text-xs", settings.mode === m.id ? "opacity-80" : "text-muted-foreground")}>{t.modes[m.id].hint}</div>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 space-y-5">
        <Segmented
          label={t.difficulty}
          value={settings.difficulty}
          options={DIFFICULTIES}
          onChange={(v) => update({ difficulty: v })}
          render={(v) => t.difficulties[v]}
        />
        <Segmented
          label={t.questions}
          value={settings.count}
          options={COUNTS}
          onChange={(v) => update({ count: v })}
          render={(v) => t.num(v)}
        />
      </div>

      <button
        onClick={onStart}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
      >
        {t.startQuiz} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/* ---------------- Game ---------------- */

function Game({
  round,
  settings,
  onDone,
  onQuit,
}: {
  round: Question[];
  settings: Settings;
  onDone: (r: Omit<Result, "settings">) => void;
  onQuit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [gain, setGain] = useState<number | null>(null);
  const [streakEnded, setStreakEnded] = useState(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const { t, district, division } = useLang();

  const q = round[idx];
  const isFind = q.mode === "find";

  const resolve = useCallback(
    (value: string | null) => {
      if (revealed) return;
      const correct = value === q.answer;
      setPicked(value);
      setRevealed(true);
      setAnswers((a) => [...a, { id: q.district.id, correct }]);
      if (correct) {
        const s = streak + 1;
        const g = 100 + speedBonus(timeLeft) + streakBonus(s);
        setStreak(s);
        setBestStreak((b) => Math.max(b, s));
        setScore((x) => x + g);
        setGain(g);
        setStreakEnded(false);
      } else {
        setStreakEnded(streak >= 2);
        setStreak(0);
        setGain(null);
      }
      setTimeout(() => nextBtn.current?.focus(), 50);
    },
    [revealed, q, streak, timeLeft],
  );

  useEffect(() => {
    if (revealed) return;
    if (timeLeft <= 0) {
      resolve(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, revealed, resolve]);

  const next = () => {
    if (idx + 1 >= round.length) {
      onDone({ score, answers, bestStreak });
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
    setTimeLeft(QUESTION_SECONDS);
    setGain(null);
    setStreakEnded(false);
  };

  const states = useMemo(() => {
    const s: Record<string, DistrictState> = {};
    const id = q.district.id;
    if (!revealed) {
      if (!isFind) s[id] = "target";
      return s;
    }
    const correct = picked === q.answer;
    s[id] = "correct";
    if (!correct && picked) {
      const wrong = isFind ? byId.get(picked) : q.mode === "district" ? DISTRICTS.find((d) => d.name === picked) : undefined;
      if (wrong) s[wrong.id] = "incorrect";
    }
    return s;
  }, [q, revealed, picked, isFind]);

  const correct = revealed && picked === q.answer;
  const prompt = q.mode === "district" ? t.promptDistrict : q.mode === "division" ? t.promptDivision : null;
  const choiceLabel = (c: string) => (q.mode === "division" ? division(c) : district(c));
  const name = district(q.district.name);
  const urgent = timeLeft <= 5 && !revealed;

  return (
    <div>
      {/* Status bar */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">
              {t.questionOf(idx + 1, round.length)}
            </span>
            <button onClick={onQuit} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              {t.quit}
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={idx + (revealed ? 1 : 0)} aria-valuemax={round.length}>
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${((idx + (revealed ? 1 : 0)) / round.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            key={streak}
            initial={{ scale: streak > 0 ? 1.25 : 1 }}
            animate={{ scale: 1 }}
            className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-bold", streak > 0 ? "text-ember" : "text-muted-foreground")}
            aria-label={t.streakAria(streak)}
          >
            <Flame className="size-4" /> {t.num(streak)}
          </motion.div>
          <div className="relative rounded-lg border bg-card px-3 py-1.5 font-display text-lg font-bold tabular-nums" aria-label={t.scoreAria(score)}>
            {t.num(score)}
            <AnimatePresence>
              {gain && (
                <motion.span
                  key={`${idx}-gain`}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -22 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-1 right-1 text-sm text-success"
                >
                  +{t.num(gain)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border bg-card/60 p-3 shadow-card md:p-6">
          <BangladeshMap
            states={states}
            focusId={!isFind || revealed ? q.district.id : undefined}
            halo={settings.difficulty === "easy" && !isFind}
            interactive={isFind && !revealed}
            onSelect={(d) => resolve(d.id)}
            ariaLabel={isFind ? t.mapFindAria(name) : t.mapHighlightAria}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold md:text-2xl">
                {prompt ?? (
                  <>
                    {t.findPrompt[0]}
                    <span className="text-accent">{name}</span>
                    {t.findPrompt[1]}
                  </>
                )}
              </h1>
              <div
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 font-display text-lg font-bold tabular-nums transition-colors",
                  urgent ? "border-destructive text-destructive" : "text-muted-foreground",
                )}
                aria-live="off"
                aria-label={t.secondsLeft(timeLeft)}
              >
                <Timer className="size-4" />
                <motion.span key={timeLeft} initial={urgent ? { scale: 1.2 } : false} animate={{ scale: 1 }}>
                  {t.num(timeLeft)}
                </motion.span>
              </div>
            </div>
            {isFind && !revealed && (
              <p className="mt-2 text-sm text-muted-foreground">{t.findHint}</p>
            )}
          </div>

          {!isFind && (
            <div className="grid grid-cols-2 gap-2">
              {q.choices.map((c, i) => {
                const isAns = c === q.answer;
                const isPicked = c === picked;
                return (
                  <motion.button
                    key={c}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={revealed}
                    onClick={() => resolve(c)}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left font-semibold transition",
                      !revealed && "bg-secondary hover:border-accent hover:bg-muted",
                      revealed && isAns && "border-success bg-success text-success-foreground",
                      revealed && isPicked && !isAns && "border-destructive bg-destructive text-destructive-foreground",
                      revealed && !isAns && !isPicked && "opacity-50",
                    )}
                  >
                    <span>{choiceLabel(c)}</span>
                    {revealed && isAns && <Check className="size-4 shrink-0" aria-label={t.correctAnswer} />}
                    {revealed && isPicked && !isAns && <X className="size-4 shrink-0" aria-label={t.yourAnswer} />}
                  </motion.button>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-card p-5"
                role="status"
              >
                <p className={cn("flex items-center gap-2 text-lg font-bold", correct ? "text-success" : "text-destructive")}>
                  {correct ? <Check className="size-5" /> : <X className="size-5" />}
                  {correct ? t.correct : picked === null ? t.timeUp : t.notQuite}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {correct || q.mode === "division"
                    ? t.inDivision(name, division(q.district.division))
                    : isFind
                      ? t.wrongFind(picked ? district(byId.get(picked)?.name ?? "") : undefined, name)
                      : t.highlightedIs(name)}
                </p>
                {streakEnded && <p className="mt-2 text-xs text-muted-foreground">{t.streakEnded}</p>}
                {correct && streak >= 2 && (
                  <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-ember">
                    <Flame className="size-4" /> {t.streakN(streak)}
                  </p>
                )}
                <button
                  ref={nextBtn}
                  onClick={next}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
                >
                  {idx + 1 >= round.length ? t.seeResults : t.nextQuestion} <ArrowRight className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Results ---------------- */

function Results({ result, onAgain, onSetup }: { result: Result; onAgain: () => void; onSetup: () => void }) {
  const total = result.answers.length;
  const correct = result.answers.filter((a) => a.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const [newBest, setNewBest] = useState(false);
  const saved = useRef(false);
  const { t } = useLang();

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    setNewBest(recordGame({ score: result.score, correct, total, bestStreak: result.bestStreak }).newBest);
  }, [result, correct, total]);

  const states = useMemo(() => {
    const s: Record<string, DistrictState> = {};
    for (const a of result.answers) s[a.id] = a.correct ? "correct" : "incorrect";
    return s;
  }, [result]);
  const shared = useMemo<Challenge>(
    () => ({ ...result.settings, score: correct, total, streak: result.bestStreak }),
    [result, correct, total],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-card">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl" aria-hidden>
          🎉
        </motion.div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t.quizComplete}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.modes[result.settings.mode].label} · {t.difficulties[result.settings.difficulty]}
        </p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-2 font-display text-7xl font-extrabold tabular-nums"
        >
          {t.num(result.score)}
        </motion.p>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">{t.points}</p>
        {newBest && (
          <p className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            <Trophy className="size-3.5" /> {t.newBest}
          </p>
        )}
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 text-2xl font-bold text-accent">
          {t.rating(pct)}
        </motion.h2>
        <dl className="mt-6 grid grid-cols-3 gap-2">
          {[
            [`${t.num(correct)}/${t.num(total)}`, t.correctLabel],
            [t.pct(pct), t.accuracy],
            [t.num(result.bestStreak), t.bestStreak],
          ].map(([v, l]) => (
            <div key={String(l)} className="rounded-xl border bg-secondary p-3">
              <dd className="font-display text-2xl font-bold">{v}</dd>
              <dt className="text-xs text-muted-foreground">{l}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <ShareButtons result={shared} />
        </div>
        <button
          onClick={onAgain}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RotateCcw className="size-4" /> {t.playAgain}
        </button>
        <div className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
          <button onClick={onSetup} className="hover:text-foreground">{t.changeSettings}</button>
          <Link to="/explore" className="hover:text-foreground">{t.exploreDistrictsLink}</Link>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/60 p-4 shadow-card md:p-6">
        <ResultCardPreview result={shared} states={states} />
      </div>
    </div>
  );
}
