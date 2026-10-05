import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { BangladeshMap, type DistrictState } from "@/components/BangladeshMap";
import { DISTRICTS } from "@/data/districts";
import { useLang } from "@/lib/i18n";
import { emptyStats, loadStats, type Stats } from "@/lib/quiz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "বাংলাদেশ কুইজ ম্যাপ — বাংলাদেশকে আপনি কতটা চেনেন?" },
      { name: "description", content: "ইন্টারঅ্যাকটিভ ম্যাপ কুইজে বাংলাদেশের ৬৪টি জেলা সম্পর্কে আপনার জ্ঞান যাচাই করুন।" },
      { property: "og:title", content: "বাংলাদেশ কুইজ ম্যাপ" },
      { property: "og:description", content: "৬৪টি জেলা। একটি ম্যাপ। সবগুলো কি ঠিকঠাক পারবেন?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function useCyclingDistrict() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 7) % DISTRICTS.length), 1600);
    return () => clearInterval(t);
  }, []);
  return DISTRICTS[i];
}

function Home() {
  const d = useCyclingDistrict();
  const { t, district } = useLang();
  const [stats, setStats] = useState<Stats>(emptyStats);
  useEffect(() => setStats(loadStats()), []);
  const states: Record<string, DistrictState> = { [d.id]: "target" };
  const acc = stats.totalAnswered ? Math.round((stats.districtsCorrect / stats.totalAnswered) * 100) : 0;

  return (
    <div className="py-10 md:py-16">
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="mb-4 text-4xl" aria-hidden>🇧🇩</p>
          <h1 className="text-5xl font-extrabold leading-[0.95] md:text-7xl">{t.siteName}</h1>
          <p className="mt-5 text-xl font-semibold text-accent md:text-2xl">{t.tagline}</p>
          <p className="mt-3 max-w-md text-muted-foreground">
            {t.homeIntro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-card transition hover:opacity-90"
            >
              {t.startQuiz} <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-lg border bg-secondary px-6 py-3 font-semibold transition hover:bg-muted"
            >
              <Compass className="size-4" /> {t.exploreDistricts}
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              [t.num(64), t.districts],
              [t.num(8), t.divisions],
              ["∞", t.challenges],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl border bg-card p-4">
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-extrabold">{n}</dd>
                <dd className="text-xs uppercase tracking-wider text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-3xl border bg-card/60 p-6 shadow-card"
        >
          <BangladeshMap states={states} focusId={d.id} ariaLabel={t.mapPreviewAria} />
          <motion.p
            key={d.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-5 left-6 text-sm text-muted-foreground"
          >
            {t.whichDistrict} <span className="font-semibold text-foreground">{district(d.name)}</span>
          </motion.p>
        </motion.div>
      </section>

      {stats.gamesPlayed > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-2xl font-bold">{t.yourStats}</h2>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [t.gamesPlayed, t.num(stats.gamesPlayed)],
              [t.bestScore, t.num(stats.bestScore.toLocaleString("en-US"))],
              [t.bestStreak, t.num(stats.bestStreak)],
              [t.accuracy, t.pct(acc)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border bg-card p-4">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{l}</dt>
                <dd className="font-display text-2xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
