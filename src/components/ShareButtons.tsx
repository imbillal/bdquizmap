import { useEffect, useState } from "react";
import { Facebook, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { accuracy, challengeUrl, shareLinks, type Challenge } from "@/lib/share";

export async function copyText(text: string, done: string, failed: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error(failed);
  }
}

const btn =
  "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border bg-secondary px-2 py-2.5 text-xs font-semibold whitespace-nowrap hover:bg-muted sm:gap-2 sm:text-sm";

export function ShareButtons({ result }: { result: Challenge }) {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(challengeUrl(result)), [result]);

  const pct = accuracy(result);
  const links = shareLinks(url, t.shareMessage(pct));

  return (
    <section aria-labelledby="share-heading" className="text-left">
      <h3
        id="share-heading"
        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {t.shareYourResult}
      </h3>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {/* Facebook ignores pre-filled text, so copy the message for the user to paste. */}
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            copyText(t.scoreMessage(result.score, result.total, pct), t.fbCopied, t.copyFailed)
          }
          className={btn}
        >
          <Facebook className="size-4 shrink-0" /> Facebook
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer" className={btn}>
          <span aria-hidden className="text-base leading-none font-bold">
            𝕏
          </span>{" "}
          X
        </a>
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className={btn}>
          <Linkedin className="size-4 shrink-0" /> LinkedIn
        </a>
      </div>
    </section>
  );
}
