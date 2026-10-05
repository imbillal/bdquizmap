import { useEffect, useState } from "react";
import { ArrowRight, Facebook, Link2, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { accuracy, challengeUrl, shareLinks, type Challenge } from "@/lib/share";

const btn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border bg-secondary px-3 py-2.5 text-sm font-semibold hover:bg-muted";

export function ShareButtons({ result }: { result: Challenge }) {
  const { t } = useLang();
  const [canShare, setCanShare] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    setUrl(challengeUrl(result));
  }, [result]);

  const pct = accuracy(result);
  const links = shareLinks(url, t.shareMessage(pct));
  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(done);
    } catch {
      toast.error(t.copyFailed);
    }
  };
  const challenge = async () => {
    const text = t.challengeMessage(result.score, result.total);
    if (!canShare) return copy(`${text} ${url}`, t.challengeCopied);
    try {
      await navigator.share({ title: t.siteName, text, url });
    } catch {
      /* cancelled */
    }
  };

  return (
    <section aria-labelledby="share-heading" className="text-left">
      <h3
        id="share-heading"
        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {t.shareYourResult}
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* Facebook ignores pre-filled text, so copy the message for the user to paste. */}
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => copy(t.scoreMessage(result.score, result.total, pct), t.fbCopied)}
          className={btn}
        >
          <Facebook className="size-4" /> Facebook
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer" className={btn}>
          <span aria-hidden className="text-base leading-none font-bold">
            𝕏
          </span>{" "}
          X
        </a>
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className={btn}>
          <Linkedin className="size-4" /> LinkedIn
        </a>
        <button onClick={() => copy(url, t.linkCopied)} className={btn}>
          <Link2 className="size-4" /> {t.copyLink}
        </button>
      </div>
      <button
        onClick={challenge}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground hover:opacity-90"
      >
        {t.challengeFriend} <ArrowRight className="size-4" />
      </button>
    </section>
  );
}
