import { useEffect, useSyncExternalStore } from "react";
import type { Difficulty, Mode } from "@/lib/quiz";

export type Lang = "bn" | "en";
export const DEFAULT_LANG: Lang = "bn";
const LANG_KEY = "bqm-lang";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnNum = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);

/* ---------- Place names (keyed by the English names used in the data) ---------- */
const DISTRICT_BN: Record<string, string> = {
  Bagerhat: "বাগেরহাট",
  Bandarban: "বান্দরবান",
  Barguna: "বরগুনা",
  Barishal: "বরিশাল",
  Bhola: "ভোলা",
  Bogura: "বগুড়া",
  Brahmanbaria: "ব্রাহ্মণবাড়িয়া",
  Chandpur: "চাঁদপুর",
  "Chapai Nawabganj": "চাঁপাইনবাবগঞ্জ",
  Chattogram: "চট্টগ্রাম",
  Chuadanga: "চুয়াডাঙ্গা",
  "Cox's Bazar": "কক্সবাজার",
  Cumilla: "কুমিল্লা",
  Dhaka: "ঢাকা",
  Dinajpur: "দিনাজপুর",
  Faridpur: "ফরিদপুর",
  Feni: "ফেনী",
  Gaibandha: "গাইবান্ধা",
  Gazipur: "গাজীপুর",
  Gopalganj: "গোপালগঞ্জ",
  Habiganj: "হবিগঞ্জ",
  Jamalpur: "জামালপুর",
  Jashore: "যশোর",
  Jhalokathi: "ঝালকাঠি",
  Jhenaidah: "ঝিনাইদহ",
  Joypurhat: "জয়পুরহাট",
  Khagrachhari: "খাগড়াছড়ি",
  Khulna: "খুলনা",
  Kishoreganj: "কিশোরগঞ্জ",
  Kurigram: "কুড়িগ্রাম",
  Kushtia: "কুষ্টিয়া",
  Lakshmipur: "লক্ষ্মীপুর",
  Lalmonirhat: "লালমনিরহাট",
  Madaripur: "মাদারীপুর",
  Magura: "মাগুরা",
  Manikganj: "মানিকগঞ্জ",
  Meherpur: "মেহেরপুর",
  Moulvibazar: "মৌলভীবাজার",
  Munshiganj: "মুন্সিগঞ্জ",
  Mymensingh: "ময়মনসিংহ",
  Naogaon: "নওগাঁ",
  Narail: "নড়াইল",
  Narayanganj: "নারায়ণগঞ্জ",
  Narsingdi: "নরসিংদী",
  Natore: "নাটোর",
  Netrokona: "নেত্রকোনা",
  Nilphamari: "নীলফামারী",
  Noakhali: "নোয়াখালী",
  Pabna: "পাবনা",
  Panchagarh: "পঞ্চগড়",
  Patuakhali: "পটুয়াখালী",
  Pirojpur: "পিরোজপুর",
  Rajbari: "রাজবাড়ী",
  Rajshahi: "রাজশাহী",
  Rangamati: "রাঙ্গামাটি",
  Rangpur: "রংপুর",
  Satkhira: "সাতক্ষীরা",
  Shariatpur: "শরীয়তপুর",
  Sherpur: "শেরপুর",
  Sirajganj: "সিরাজগঞ্জ",
  Sunamganj: "সুনামগঞ্জ",
  Sylhet: "সিলেট",
  Tangail: "টাঙ্গাইল",
  Thakurgaon: "ঠাকুরগাঁও",
};
const DIVISION_BN: Record<string, string> = {
  Dhaka: "ঢাকা",
  Chattogram: "চট্টগ্রাম",
  Rajshahi: "রাজশাহী",
  Khulna: "খুলনা",
  Barishal: "বরিশাল",
  Sylhet: "সিলেট",
  Rangpur: "রংপুর",
  Mymensingh: "ময়মনসিংহ",
};

/* ---------- UI strings ---------- */
type N = number | string;
const en = {
  num: (v: N) => String(v),
  pct: (v: N) => `${v}%`,
  siteName: "Bangladesh Quiz Map",
  tagline: "How well do you know Bangladesh?",
  switchLang: "বাংলা",
  switchLangAria: "বাংলায় দেখুন",
  openCommand: "Open command palette",
  navQuiz: "Quiz",
  navExplore: "Explore",

  // Home
  homeIntro: "Test your knowledge of Bangladesh's 64 districts through an interactive map.",
  startQuiz: "Start Quiz",
  exploreDistricts: "Explore Districts",
  districts: "Districts",
  divisions: "Divisions",
  challenges: "Challenges",
  mapPreviewAria: "Animated preview of the Bangladesh map",
  whichDistrict: "Which district is this?",
  yourStats: "Your Stats",
  gamesPlayed: "Games Played",
  bestScore: "Best Score",
  bestStreak: "Best Streak",
  accuracy: "Accuracy",

  // Explore
  exploreTitle: "Explore Bangladesh",
  exploreSub: "Tap a district to see where it belongs.",
  searchDistricts: "Search districts...",
  clearSelection: "Clear selection",
  division: "Division",
  district: "District",
  playThisDistrict: "Play This District",
  districtNotFound: (d: string) => `We couldn't find a district called "${d}".`,
  noDistrictSelected: "No district selected yet.",
  eightDivisions: "8 Divisions",

  // Setup
  setupTitle: "Set up your game",
  setupSub: "64 districts. One map. Can you get them all right?",
  quizMode: "Quiz mode",
  difficulty: "Difficulty",
  questions: "Questions",
  modes: {
    district: { label: "Identify District", hint: "Name the highlighted district" },
    division: { label: "Identify Division", hint: "Which division is it in?" },
    find: { label: "Find District", hint: "Tap it on the map" },
  } satisfies Record<Mode, { label: string; hint: string }>,
  difficulties: { easy: "Easy", medium: "Medium", hard: "Hard" } satisfies Record<
    Difficulty,
    string
  >,

  // Game
  questionOf: (i: number, n: number) => `Question ${i} of ${n}`,
  quit: "Quit",
  streakAria: (n: number) => `${n} answer streak`,
  scoreAria: (n: number) => `Score ${n}`,
  secondsLeft: (n: number) => `${n} seconds left`,
  promptDistrict: "Which district is highlighted?",
  promptDivision: "Which division does this district belong to?",
  findPrompt: ["Find ", " on the map"] as readonly [string, string],
  findHint: "Tap a district, or use Tab and Enter to choose.",
  mapFindAria: (d: string) => `Map: find ${d}`,
  mapHighlightAria: "Map with one district highlighted",
  correctAnswer: "Correct answer",
  yourAnswer: "Your answer",
  correct: "Correct!",
  timeUp: "Time's up!",
  notQuite: "Not quite!",
  inDivision: (d: string, v: string) => `${d} is in ${v} Division.`,
  wrongFind: (picked: string | undefined, d: string) =>
    `That's ${picked ?? "not it"}. ${d} is now shown on the map.`,
  highlightedIs: (d: string) => `The highlighted district is ${d}.`,
  streakEnded: "Streak ended",
  streakN: (n: number) => `${n} answer streak`,
  seeResults: "See Results",
  nextQuestion: "Next Question",

  // Results
  quizComplete: "Quiz complete",
  points: "Points",
  newBest: "New personal best",
  correctLabel: "Correct",
  playAgain: "Play Again",
  changeSettings: "Change settings",
  exploreDistrictsLink: "Explore districts",
  rating: (pct: number): string =>
    pct >= 90
      ? "Bangladesh Geography Expert 🇧🇩"
      : pct >= 70
        ? "Great Bangladesh Knowledge 🇧🇩"
        : pct >= 50
          ? "Keep Exploring Bangladesh!"
          : "Time to Explore Bangladesh",

  // Share
  shareYourResult: "Share your result",
  copyLink: "Copy Link",
  linkCopied: "Result link copied!",
  copyFailed: "Couldn't copy — try selecting the link instead",
  fbCopied: "Message copied — paste it into your post",
  shareMessage: (pct: number) => `I scored ${pct}% on the Bangladesh Quiz 🇧🇩 Can you beat me?`,
  scoreMessage: (s: number, t: number, pct: number) =>
    `I scored ${s}/${t} (${pct}%) on the Bangladesh Quiz 🇧🇩 Can you beat me?`,

  // Result card
  cardHeadline: ["How well do you know", "Bangladesh?"] as readonly [string, string],
  accuracyN: (pct: number) => `${pct}% accuracy`,
  streakLabel: (n: number) => `${n} streak`,
  canYouBeat: "Can you beat my score?",
  imageFailed: "Couldn't create the image — try again",
  resultMapAria: "Result map",

  // Challenge
  challenged: "You've been challenged",
  friendScored: "A friend scored",
  questionsN: (n: number) => `${n} questions`,
  acceptChallenge: "Accept Challenge",
  challengeIncomplete: "This challenge link is incomplete",
  challengeStillPlay: "You can still test yourself on all 64 districts.",
  playTheQuiz: "Play the Quiz",

  // Command palette
  searchCommands: "Search districts or actions...",
  noResults: "No results.",
  actions: "Actions",
  startQuizCmd: "Start quiz",
  difficultyCmd: (d: string) => `${d} difficulty`,

  // Errors
  notFoundTitle: "Page not found",
  notFoundBody: "The page you're looking for doesn't exist or has been moved.",
  goHome: "Go home",
  errorTitle: "This page didn't load",
  errorBody: "Something went wrong on our end. You can try refreshing or head back home.",
  tryAgain: "Try again",
};

const bn: typeof en = {
  num: bnNum,
  pct: (v) => `${bnNum(v)}%`,
  siteName: "বাংলাদেশ কুইজ ম্যাপ",
  tagline: "বাংলাদেশকে আপনি কতটা চেনেন?",
  switchLang: "English",
  switchLangAria: "Switch to English",
  openCommand: "কমান্ড প্যালেট খুলুন",
  navQuiz: "কুইজ",
  navExplore: "ঘুরে দেখুন",

  homeIntro: "ইন্টারঅ্যাকটিভ ম্যাপে বাংলাদেশের ৬৪টি জেলা সম্পর্কে আপনার জ্ঞান যাচাই করুন।",
  startQuiz: "কুইজ শুরু করুন",
  exploreDistricts: "জেলাগুলো ঘুরে দেখুন",
  districts: "জেলা",
  divisions: "বিভাগ",
  challenges: "চ্যালেঞ্জ",
  mapPreviewAria: "বাংলাদেশের ম্যাপের অ্যানিমেটেড প্রিভিউ",
  whichDistrict: "এটি কোন জেলা?",
  yourStats: "আপনার পরিসংখ্যান",
  gamesPlayed: "খেলা হয়েছে",
  bestScore: "সেরা স্কোর",
  bestStreak: "সেরা স্ট্রিক",
  accuracy: "নির্ভুলতা",

  exploreTitle: "বাংলাদেশ ঘুরে দেখুন",
  exploreSub: "কোন জেলা কোথায়, দেখতে একটি জেলায় ট্যাপ করুন।",
  searchDistricts: "জেলা খুঁজুন...",
  clearSelection: "নির্বাচন মুছুন",
  division: "বিভাগ",
  district: "জেলা",
  playThisDistrict: "এই জেলা দিয়ে খেলুন",
  districtNotFound: (d) => `"${d}" নামে কোনো জেলা পাওয়া যায়নি।`,
  noDistrictSelected: "এখনো কোনো জেলা নির্বাচন করা হয়নি।",
  eightDivisions: "৮টি বিভাগ",

  setupTitle: "আপনার খেলা সাজান",
  setupSub: "৬৪টি জেলা। একটি ম্যাপ। সবগুলো কি ঠিকঠাক পারবেন?",
  quizMode: "কুইজের ধরন",
  difficulty: "কাঠিন্য",
  questions: "প্রশ্ন",
  modes: {
    district: { label: "জেলা চিনুন", hint: "হাইলাইট করা জেলার নাম বলুন" },
    division: { label: "বিভাগ চিনুন", hint: "এটি কোন বিভাগে?" },
    find: { label: "জেলা খুঁজুন", hint: "ম্যাপে ট্যাপ করুন" },
  },
  difficulties: { easy: "সহজ", medium: "মাঝারি", hard: "কঠিন" },

  questionOf: (i, n) => `প্রশ্ন ${bnNum(i)} / ${bnNum(n)}`,
  quit: "ছেড়ে দিন",
  streakAria: (n) => `টানা ${bnNum(n)}টি সঠিক`,
  scoreAria: (n) => `স্কোর ${bnNum(n)}`,
  secondsLeft: (n) => `${bnNum(n)} সেকেন্ড বাকি`,
  promptDistrict: "হাইলাইট করা জেলাটি কোনটি?",
  promptDivision: "এই জেলাটি কোন বিভাগের অন্তর্গত?",
  findPrompt: ["ম্যাপে ", " খুঁজুন"],
  findHint: "একটি জেলায় ট্যাপ করুন, অথবা Tab ও Enter দিয়ে বেছে নিন।",
  mapFindAria: (d) => `ম্যাপ: ${d} খুঁজুন`,
  mapHighlightAria: "একটি জেলা হাইলাইট করা ম্যাপ",
  correctAnswer: "সঠিক উত্তর",
  yourAnswer: "আপনার উত্তর",
  correct: "সঠিক!",
  timeUp: "সময় শেষ!",
  notQuite: "হয়নি!",
  inDivision: (d, v) => `${d} ${v} বিভাগে অবস্থিত।`,
  wrongFind: (picked, d) =>
    `${picked ? `এটি ${picked}।` : "এটি নয়।"} ${d} এখন ম্যাপে দেখানো হয়েছে।`,
  highlightedIs: (d) => `হাইলাইট করা জেলাটি ${d}।`,
  streakEnded: "স্ট্রিক শেষ",
  streakN: (n) => `টানা ${bnNum(n)}টি সঠিক উত্তর`,
  seeResults: "ফলাফল দেখুন",
  nextQuestion: "পরের প্রশ্ন",

  quizComplete: "কুইজ শেষ",
  points: "পয়েন্ট",
  newBest: "নতুন ব্যক্তিগত রেকর্ড",
  correctLabel: "সঠিক",
  playAgain: "আবার খেলুন",
  changeSettings: "সেটিংস বদলান",
  exploreDistrictsLink: "জেলাগুলো ঘুরে দেখুন",
  rating: (pct) =>
    pct >= 90
      ? "বাংলাদেশ ভূগোল বিশেষজ্ঞ 🇧🇩"
      : pct >= 70
        ? "বাংলাদেশ সম্পর্কে দারুণ জ্ঞান 🇧🇩"
        : pct >= 50
          ? "বাংলাদেশকে আরও জানুন!"
          : "বাংলাদেশকে চেনার সময় এখন",

  shareYourResult: "আপনার ফলাফল শেয়ার করুন",
  copyLink: "লিংক কপি",
  linkCopied: "ফলাফলের লিংক কপি হয়েছে!",
  copyFailed: "কপি করা যায়নি — লিংকটি সিলেক্ট করে কপি করুন",
  fbCopied: "মেসেজ কপি হয়েছে — পোস্টে পেস্ট করুন",
  shareMessage: (pct) => `বাংলাদেশ কুইজে আমি ${bnNum(pct)}% পেয়েছি 🇧🇩 আমাকে হারাতে পারবেন?`,
  scoreMessage: (s, t, pct) =>
    `বাংলাদেশ কুইজে আমি ${bnNum(s)}/${bnNum(t)} (${bnNum(pct)}%) পেয়েছি 🇧🇩 আমাকে হারাতে পারবেন?`,

  cardHeadline: ["বাংলাদেশকে আপনি", "কতটা চেনেন?"],
  accuracyN: (pct) => `${bnNum(pct)}% নির্ভুল`,
  streakLabel: (n) => `টানা ${bnNum(n)}`,
  canYouBeat: "আমার স্কোর হারাতে পারবেন?",
  imageFailed: "ছবি তৈরি করা যায়নি — আবার চেষ্টা করুন",
  resultMapAria: "ফলাফলের ম্যাপ",

  challenged: "আপনাকে চ্যালেঞ্জ করা হয়েছে",
  friendScored: "আপনার বন্ধু পেয়েছেন",
  questionsN: (n) => `${bnNum(n)}টি প্রশ্ন`,
  acceptChallenge: "চ্যালেঞ্জ গ্রহণ করুন",
  challengeIncomplete: "এই চ্যালেঞ্জ লিংকটি অসম্পূর্ণ",
  challengeStillPlay: "তবুও আপনি ৬৪টি জেলায় নিজেকে যাচাই করতে পারেন।",
  playTheQuiz: "কুইজ খেলুন",

  searchCommands: "জেলা বা অ্যাকশন খুঁজুন...",
  noResults: "কিছু পাওয়া যায়নি।",
  actions: "অ্যাকশন",
  startQuizCmd: "কুইজ শুরু করুন",
  difficultyCmd: (d) => `কাঠিন্য: ${d}`,

  notFoundTitle: "পেজটি পাওয়া যায়নি",
  notFoundBody: "আপনি যে পেজটি খুঁজছেন সেটি নেই অথবা সরিয়ে নেওয়া হয়েছে।",
  goHome: "হোমে যান",
  errorTitle: "পেজটি লোড হয়নি",
  errorBody: "আমাদের দিকে কোনো সমস্যা হয়েছে। রিফ্রেশ করে দেখুন অথবা হোমে ফিরে যান।",
  tryAgain: "আবার চেষ্টা করুন",
};

export const STRINGS: Record<Lang, typeof en> = { en, bn };
export type Strings = typeof en;

/* ---------- Language store (browser-only persistence, Bangla by default) ---------- */
let current: Lang = DEFAULT_LANG;
try {
  if (typeof window !== "undefined" && localStorage.getItem(LANG_KEY) === "en") current = "en";
} catch {
  /* storage blocked: stay on the default */
}
const listeners = new Set<() => void>();

export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLang() {
  const lang = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_LANG,
  );
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const bnLang = lang === "bn";
  return {
    lang,
    setLang,
    t: STRINGS[lang],
    district: (name: string) => (bnLang ? (DISTRICT_BN[name] ?? name) : name),
    division: (name: string) => (bnLang ? (DIVISION_BN[name] ?? name) : name),
  };
}

/** Both spellings, for search that should match either language. */
export const districtSearchText = (name: string) => `${name} ${DISTRICT_BN[name] ?? ""}`;
export const divisionSearchText = (name: string) => `${name} ${DIVISION_BN[name] ?? ""}`;
