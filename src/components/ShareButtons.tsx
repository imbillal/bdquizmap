import { useEffect, useState } from "react";
import { ArrowRight, Facebook, Link2, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { challengeUrl, scoreMessage, shareLinks, type Challenge } from "@/lib/share";

const btn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border bg-secondary px-3 py-2.5 text-sm font-semibold hover:bg-muted";

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Couldn't copy — try selecting the link instead");
  }
}

export function ShareButtons({ result }: { result: Challenge }) {
  const [canShare, setCanShare] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    setUrl(challengeUrl(result));
  }, [result]);

  const links = shareLinks(result, url);
  const native = async (text: string) => {
    try {
      await navigator.share({ title: "Bangladesh Quiz Map", text, url });
    } catch {
      /* cancelled */
    }
  };
  const challenge = () => {
    const text = `I scored ${result.score}/${result.total} on the Bangladesh Quiz 🇧🇩 Think you can beat me?`;
    if (canShare) native(text);
    else copy(`${text} ${url}`, "Challenge copied — send it to a friend!");
  };

  return (
    <section aria-labelledby="share-heading" className="text-left">
      <h3
        id="share-heading"
        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        Share your result
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* Facebook ignores pre-filled text, so copy the message for the user to paste. */}
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => copy(scoreMessage(result), "Message copied — paste it into your post")}
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
        <button onClick={() => copy(url, "Result link copied!")} className={btn}>
          <Link2 className="size-4" /> Copy Link
        </button>
      </div>
      <button
        onClick={challenge}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground hover:opacity-90"
      >
        Challenge a Friend <ArrowRight className="size-4" />
      </button>
    </section>
  );
}
