import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Swords } from "lucide-react";
import { STRINGS, useLang } from "@/lib/i18n";
import { accuracy, parseChallenge, type Challenge } from "@/lib/share";

export const Route = createFileRoute("/challenge")({
  // The whole challenge lives in the URL, so no backend or database is needed.
  validateSearch: (s: Record<string, unknown>): Partial<Challenge> => parseChallenge(s) ?? {},
  head: ({ match }) => {
    const c = parseChallenge(match.search);
    const t = STRINGS.bn;
    const title = c ? t.scoreMessage(c.score, c.total, accuracy(c)) : t.siteName;
    const description = "বাংলাদেশকে আপনি কতটা চেনেন? ৬৪টি জেলার ম্যাপ কুইজ।";
    return {
      meta: [
        { title: `${title} — ${t.siteName}` },
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
  const { t } = useLang();

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-md rounded-3xl border bg-card p-6 text-center shadow-card md:p-8">
        <Swords className="mx-auto size-10 text-accent" aria-hidden />
        {c ? (
          <>
            <p className="mt-3 text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
              {t.challenged}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold">{t.friendScored}</h1>
            <p className="mt-2 font-display font-extrabold tabular-nums">
              <span className="text-7xl">{t.num(c.score)}</span>
              <span className="text-3xl text-muted-foreground"> / {t.num(c.total)}</span>
            </p>
            <p className="mt-3 flex items-center justify-center gap-3 text-sm font-semibold">
              <span className="text-success">{t.accuracyN(accuracy(c))}</span>
              <span className="flex items-center gap-1 text-ember">
                <Flame className="size-4" /> {t.streakLabel(c.streak)}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.modes[c.mode].label} · {t.difficulties[c.difficulty]} · {t.questionsN(c.total)}
            </p>
            <Link
              to="/quiz"
              search={{ mode: c.mode, difficulty: c.difficulty, count: c.total, start: true }}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              {t.acceptChallenge} <ArrowRight className="size-4" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">{t.challengeIncomplete}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.challengeStillPlay}</p>
            <Link
              to="/quiz"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              {t.playTheQuiz} <ArrowRight className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
