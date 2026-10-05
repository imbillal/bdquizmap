import { forwardRef, useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BangladeshMap, type DistrictState } from "@/components/BangladeshMap";
import { useLang } from "@/lib/i18n";
import { accuracy, type Challenge } from "@/lib/share";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

type CardProps = { result: Challenge; states: Record<string, DistrictState> };

/** The shareable image, laid out at its real export size (1080 × 1350). */
export const ResultCard = forwardRef<HTMLDivElement, CardProps>(function ResultCard(
  { result, states },
  ref,
) {
  const { t } = useLang();
  const pct = accuracy(result);
  return (
    <div
      ref={ref}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className="flex flex-col bg-background p-20 text-foreground"
    >
      <p className="text-[28px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        <span aria-hidden>🇧🇩</span> {t.siteName}
      </p>
      <h2 className="mt-6 font-display text-[64px] leading-[1.2] font-extrabold uppercase">
        {t.cardHeadline[0]}
        <br />
        <span className="text-accent">{t.cardHeadline[1]}</span>
      </h2>

      <div className="mt-10 grid flex-1 grid-cols-[1fr_440px] items-center gap-10">
        <div className="flex flex-col gap-7">
          <p className="font-display leading-none font-extrabold tabular-nums">
            <span className="text-[190px]">{t.num(result.score)}</span>
            <span className="text-[80px] text-muted-foreground"> / {t.num(result.total)}</span>
          </p>
          <div className="flex flex-wrap gap-4 text-[34px] font-bold uppercase">
            <span className="rounded-2xl border-2 border-current/20 px-6 py-3 text-success">
              {t.accuracyN(pct)}
            </span>
            <span className="rounded-2xl border-2 border-current/20 px-6 py-3 text-ember">
              🔥 {t.streakLabel(result.streak)}
            </span>
          </div>
          <p className="text-[30px] font-semibold text-muted-foreground">
            {t.modes[result.mode].label} · {t.difficulties[result.difficulty]}
          </p>
          <p className="font-display text-[50px] leading-tight font-bold">{t.rating(pct)}</p>
        </div>
        <BangladeshMap
          states={states}
          ariaLabel={t.resultMapAria}
          className="h-[640px] [&_svg]:max-h-none"
        />
      </div>

      <div className="mt-10 flex items-end justify-between border-t-2 pt-10">
        <p className="font-display text-[48px] font-bold">{t.canYouBeat}</p>
        <p className="font-display text-[34px] font-extrabold tracking-[0.2em] text-accent">
          MAPBANGLA
        </p>
      </div>
    </div>
  );
});

type Format = "png" | "jpeg";

/** Scaled-down live preview of the card plus client-side PNG/JPEG downloads. */
export function ResultCardPreview(props: CardProps) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [busy, setBusy] = useState<Format | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setScale(e.contentRect.width / CARD_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const download = async (format: Format) => {
    if (!card.current) return;
    setBusy(format);
    // The map's fills come from stylesheet classes that don't survive into the image,
    // so pin each path's computed paint inline for the capture.
    const paths = [...card.current.querySelectorAll<SVGPathElement>("svg path")];
    for (const p of paths) {
      const cs = getComputedStyle(p);
      p.style.fill = cs.fill;
      p.style.stroke = cs.stroke;
      p.style.strokeWidth = cs.strokeWidth;
    }
    try {
      // Rendered entirely in the browser (SVG foreignObject → canvas); nothing leaves the device.
      const { toJpeg, toPng } = await import("html-to-image");
      const options = {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: getComputedStyle(card.current).backgroundColor,
      };
      const url =
        format === "png"
          ? await toPng(card.current, options)
          : await toJpeg(card.current, { ...options, quality: 0.92 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `bangladesh-quiz-${props.result.score}-of-${props.result.total}.${format === "png" ? "png" : "jpg"}`;
      a.click();
    } catch {
      toast.error(t.imageFailed);
    } finally {
      for (const p of paths) p.removeAttribute("style");
      setBusy(null);
    }
  };

  return (
    <div>
      <div ref={box} className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border">
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `scale(${scale})` }}
          aria-hidden
        >
          <ResultCard ref={card} {...props} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["png", "jpeg"] as const).map((f) => (
          <button
            key={f}
            onClick={() => download(f)}
            disabled={busy !== null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border bg-secondary px-4 py-3 font-semibold hover:bg-muted disabled:opacity-60"
          >
            {busy === f ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t.download(f.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  );
}
