import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Swords } from "lucide-react";
import { accuracy, modeLabel, parseChallenge, type Challenge } from "@/lib/share";

export const Route = createFileRoute("/challenge")({
  // The whole challenge lives in the URL, so no backend or database is needed.
  validateSearch: (s: Record<string, unknown>): Partial<Challenge> => parseChallenge(s) ?? {},
  head: ({ match }) => {
    const c = parseChallenge(match.search);
    const title = c
      ? `I scored ${c.score}/${c.total} on the Bangladesh Quiz 🇧🇩 Can you beat me?`
      : "Take the Bangladesh Quiz Map challenge";
    const description = "How well do you know Bangladesh? A map quiz of all 64 districts.";
    return {
      meta: [
        { title: `${title} — Bangladesh Quiz Map` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: ChallengePage,
});

function ChallengePage() {
  const c = parseChallenge(Route.useSearch());

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-md rounded-3xl border bg-card p-6 text-center shadow-card md:p-8">
        <Swords className="mx-auto size-10 text-accent" aria-hidden />
        {c ? (
          <>
            <p className="mt-3 text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
              You've been challenged
            </p>
            <h1 className="mt-2 text-2xl font-extrabold">A friend scored</h1>
            <p className="mt-2 font-display font-extrabold tabular-nums">
              <span className="text-7xl">{c.score}</span>
              <span className="text-3xl text-muted-foreground"> / {c.total}</span>
            </p>
            <p className="mt-3 flex items-center justify-center gap-3 text-sm font-semibold">
              <span className="text-success">{accuracy(c)}% accuracy</span>
              <span className="flex items-center gap-1 text-ember">
                <Flame className="size-4" /> {c.streak} streak
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground capitalize">
              {modeLabel(c.mode)} · {c.difficulty} · {c.total} questions
            </p>
            <Link
              to="/quiz"
              search={{ mode: c.mode, difficulty: c.difficulty, count: c.total, start: true }}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              Accept Challenge <ArrowRight className="size-4" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">This challenge link is incomplete</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You can still test yourself on all 64 districts.
            </p>
            <Link
              to="/quiz"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              Play the Quiz <ArrowRight className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
