import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Play, Search, X } from "lucide-react";
import { BangladeshMap, type DistrictState } from "@/components/BangladeshMap";
import { DISTRICTS, DIVISIONS } from "@/data/districts";
import { districtSearchText, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): { district?: string } => ({
    district: typeof s.district === "string" ? s.district : undefined,
  }),
  head: () => ({
    meta: [
      { title: "বাংলাদেশ ঘুরে দেখুন — বাংলাদেশ কুইজ ম্যাপ" },
      { name: "description", content: "ইন্টারঅ্যাকটিভ ম্যাপে ৮টি বিভাগে ভাগ করা বাংলাদেশের ৬৪টি জেলা ঘুরে দেখুন।" },
      { property: "og:title", content: "বাংলাদেশের ৬৪টি জেলা ঘুরে দেখুন" },
      { property: "og:description", content: "যেকোনো জেলায় ক্লিক করে তার বিভাগ দেখুন, তারপর নিজেকে যাচাই করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { district } = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const [q, setQ] = useState("");
  const { t, district: dName, division } = useLang();
  const selected = DISTRICTS.find((d) => d.slug === district);
  const invalid = district && !selected;

  const select = (slug?: string) => navigate({ search: { district: slug }, replace: true });
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? DISTRICTS.filter((d) => districtSearchText(d.name).toLowerCase().includes(s)).slice(0, 6) : [];
  }, [q]);

  const states: Record<string, DistrictState> = {};
  if (selected) {
    for (const d of DISTRICTS) if (d.division === selected.division) states[d.id] = "division";
    states[selected.id] = "selected";
  }

  return (
    <div className="py-8">
      <h1 className="text-4xl font-extrabold md:text-5xl">{t.exploreTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.exploreSub}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border bg-card/60 p-4 shadow-card md:p-6">
          <BangladeshMap
            interactive
            showTooltip
            states={states}
            focusId={selected?.id}
            onSelect={(d) => select(d.slug)}
          />
        </div>

        <aside className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchDistricts}
              aria-label={t.searchDistricts}
              className="w-full rounded-lg border bg-input/40 py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
            />
            {results.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-card" role="listbox">
                {results.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => {
                        select(d.slug);
                        setQ("");
                      }}
                      className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                    >
                      {dName(d.name)}
                      <span className="text-muted-foreground">{division(d.division)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-3xl font-extrabold uppercase">{dName(selected.name)}</h2>
                  <button aria-label={t.clearSelection} onClick={() => select(undefined)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.division}</dt>
                    <dd className="font-semibold">{division(selected.division)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.district}</dt>
                    <dd className="font-semibold">{dName(selected.name)}</dd>
                  </div>
                </dl>
                <Link
                  to="/quiz"
                  search={{ mode: "district", district: selected.slug, start: true }}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Play className="size-4" /> {t.playThisDistrict}
                </Link>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                {invalid ? t.districtNotFound(district) : t.noDistrictSelected}
              </div>
            )}
          </AnimatePresence>

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">{t.eightDivisions}</h3>
            <ul className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
              {DIVISIONS.map((v) => (
                <li key={v}>
                  {division(v)}{" "}
                  <span className="text-xs">({t.num(DISTRICTS.filter((d) => d.division === v).length)})</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
