import { Link } from "@tanstack/react-router";
import { Command, Languages } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CommandPalette, useCommandPalette } from "./CommandPalette";

export function SiteHeader() {
  const cp = useCommandPalette();
  const { lang, setLang, t } = useLang();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-lg font-bold">
          <span aria-hidden className="shrink-0">🇧🇩</span>
          <span className="truncate">{t.siteName}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/quiz"
            className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block"
            activeProps={{ className: "text-foreground" }}
          >
            {t.navQuiz}
          </Link>
          <Link
            to="/explore"
            className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block"
            activeProps={{ className: "text-foreground" }}
          >
            {t.navExplore}
          </Link>
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 rounded-md border bg-secondary px-2.5 py-1.5 text-xs font-semibold hover:text-foreground"
            aria-label={t.switchLangAria}
          >
            <Languages className="size-3.5" /> {t.switchLang}
          </button>
          <button
            onClick={() => cp.setOpen(true)}
            className="flex items-center gap-1.5 rounded-md border bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label={t.openCommand}
          >
            <Command className="size-3.5" /> K
          </button>
        </nav>
      </div>
      <CommandPalette open={cp.open} setOpen={cp.setOpen} />
    </header>
  );
}
