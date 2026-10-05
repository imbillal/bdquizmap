import { describe, expect, it } from "vitest";
import { STRINGS } from "@/lib/i18n";
import { accuracy, challengeUrl, parseChallenge, shareLinks, type Challenge } from "@/lib/share";

const c: Challenge = { mode: "district", difficulty: "hard", score: 8, total: 10, streak: 5 };

describe("share", () => {
  it("round-trips a challenge through the URL", () => {
    const url = new URL(challengeUrl(c, "https://example.com"));
    expect(url.pathname).toBe("/challenge");
    expect(parseChallenge(Object.fromEntries(url.searchParams))).toEqual(c);
  });

  it("accepts numeric params and defaults difficulty", () => {
    expect(parseChallenge({ mode: "find", score: 3, total: 5 })).toEqual({
      mode: "find",
      difficulty: "medium",
      score: 3,
      total: 5,
      streak: 0,
    });
  });

  it("rejects invalid challenges", () => {
    expect(parseChallenge({ mode: "district", score: 11, total: 10 })).toBeUndefined();
    expect(parseChallenge({ mode: "district", score: 1, total: 7 })).toBeUndefined();
    expect(parseChallenge({ mode: "nope", score: 1, total: 10 })).toBeUndefined();
  });

  it("builds share-intent links with the message", () => {
    expect(accuracy(c)).toBe(80);
    const msg = STRINGS.bn.shareMessage(accuracy(c));
    expect(msg).toBe("বাংলাদেশ কুইজে আমি ৮০% পেয়েছি 🇧🇩 আমাকে হারাতে পারবেন?");
    const links = shareLinks("https://example.com/challenge?x=1", msg);
    expect(decodeURIComponent(links.x)).toContain(msg);
    expect(links.facebook).toContain(encodeURIComponent("https://example.com/challenge?x=1"));
  });
});
