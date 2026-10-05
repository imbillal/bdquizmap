import { initWasm, Resvg } from "@resvg/resvg-wasm";
import createHarfBuzz from "harfbuzzjs/hb.js";
import hbjs from "harfbuzzjs/hbjs.js";
import { DISTRICTS, MAP_HEIGHT, MAP_WIDTH } from "@/data/districts";
import { STRINGS } from "@/lib/i18n";
import { accuracy, type Challenge } from "@/lib/share";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Everything loads from free public CDNs at first use, then stays cached in memory.
// Text is shaped by HarfBuzz (correct Bangla conjuncts and vowel signs) and drawn as
// glyph outlines; resvg only rasterises the resulting shapes.
const RESVG_WASM = "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const HB_WASM = "https://cdn.jsdelivr.net/npm/harfbuzzjs@0.10.3/hb.wasm";
const FONT_URL = (w: string) =>
  `https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-${w}.ttf`;
const WEIGHTS = { 400: "Regular", 600: "SemiBold", 700: "Bold" } as const;
type Weight = keyof typeof WEIGHTS;

// Site palette (the CSS oklch tokens, resolved to hex).
const C = {
  bg: "#0d1611",
  fg: "#f3eee3",
  muted: "#a3a799",
  accent: "#57966e",
  success: "#5ebc7b",
  destructive: "#da534f",
  ember: "#fc9e47",
  land: "#283a2f",
};

type HbFont = { glyphToPath(g: number): string };
type Shaper = {
  hb: ReturnType<typeof hbjs>;
  fonts: Record<Weight, { font: HbFont; upem: number }>;
};

async function fetchBytes(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.arrayBuffer();
}

async function loadShaper(): Promise<Shaper> {
  const [wasm, ...fontBytes] = await Promise.all([
    fetchBytes(HB_WASM),
    ...Object.values(WEIGHTS).map((w) => fetchBytes(FONT_URL(w))),
  ]);
  // The Emscripten loader reads __dirname under Node to locate hb.wasm on disk. We pass
  // the bytes directly, but the identifier must still exist once bundled as ESM.
  (globalThis as { __dirname?: string }).__dirname ??= "/";
  const hb = hbjs(await createHarfBuzz({ wasmBinary: wasm }));
  const weights = Object.keys(WEIGHTS).map(Number) as Weight[];
  const fonts = Object.fromEntries(
    weights.map((w, i) => {
      const face = hb.createFace(hb.createBlob(fontBytes[i]), 0);
      return [w, { font: hb.createFont(face), upem: face.upem }];
    }),
  ) as Shaper["fonts"];
  return { hb, fonts };
}

let resvgReady: Promise<void> | undefined;
let shaperReady: Promise<Shaper> | undefined;
function loadAssets() {
  // resvg keeps its own init state, so a retry after a partial failure must tolerate it.
  resvgReady ??= initWasm(fetch(RESVG_WASM)).catch((e) => {
    if (String(e).includes("Already initialized")) return;
    resvgReady = undefined;
    throw e;
  });
  shaperReady ??= loadShaper().catch((e) => {
    shaperReady = undefined;
    throw e;
  });
  return Promise.all([resvgReady, shaperReady]).then(([, shaper]) => shaper);
}

type Run = { text: string; size: number; weight: Weight; color: string };

/** Shape runs left to right from (x, baseline y) and return them as SVG paths. */
function drawLine(s: Shaper, x: number, y: number, runs: Run[]) {
  let out = "";
  for (const run of runs) {
    const { font, upem } = s.fonts[run.weight];
    const scale = run.size / upem;
    const buf = s.hb.createBuffer();
    buf.addText(run.text);
    buf.guessSegmentProperties();
    s.hb.shape(font, buf);
    const glyphs: { g: number; ax: number; dx: number; dy: number }[] = buf.json();
    buf.destroy();
    let pen = 0;
    let d = "";
    for (const g of glyphs) {
      const path = font.glyphToPath(g.g);
      if (path) {
        const gx = x + (pen + g.dx) * scale;
        const gy = y - g.dy * scale;
        d += `<path transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${scale} ${-scale})" d="${path}"/>`;
      }
      pen += g.ax;
    }
    out += `<g fill="${run.color}">${d}</g>`;
    x += pen * scale;
  }
  return out;
}

// No emoji font is loaded, so drop emoji rather than render empty boxes.
const noEmoji = (s: string) =>
  s.replace(/\s*(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic})/gu, "");

export function buildOgSvg(s: Shaper, c: Challenge) {
  const t = STRINGS[c.lang];
  const pct = accuracy(c);
  const fill = (id: string) =>
    c.hits.includes(id) ? C.success : c.misses.includes(id) ? C.destructive : C.land;

  const mapH = 560;
  const mapScale = mapH / MAP_HEIGHT;
  const mapX = OG_WIDTH - 64 - MAP_WIDTH * mapScale;
  const mapY = (OG_HEIGHT - mapH) / 2;
  const line = (y: number, runs: Run[]) => drawLine(s, 64, y, runs);
  const run = (text: string, size: number, weight: Weight, color: string): Run => ({
    text,
    size,
    weight,
    color,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="100%" height="100%" fill="${C.bg}"/>
  <g transform="translate(${mapX} ${mapY}) scale(${mapScale})" stroke="${C.bg}" stroke-width="0.8" stroke-linejoin="round">
    ${DISTRICTS.map((d) => `<path d="${d.path}" fill="${fill(d.id)}"/>`).join("")}
  </g>
  <rect x="64" y="52" width="42" height="28" rx="4" fill="#006a4e"/>
  <circle cx="83" cy="66" r="9" fill="#f42a41"/>
  ${drawLine(s, 120, 75, [run(t.siteName, 24, 600, C.muted)])}
  ${line(140, [run(t.cardHeadline[0], 48, 700, C.fg)])}
  ${line(198, [run(t.cardHeadline[1], 48, 700, C.accent)])}
  ${line(352, [run(t.num(c.score), 150, 700, C.fg), run(` / ${t.num(c.total)}`, 60, 700, C.muted)])}
  ${line(420, [
    run(t.accuracyN(pct), 30, 700, C.success),
    run("  ·  ", 30, 700, C.muted),
    run(t.streakLabel(c.streak), 30, 700, C.ember),
  ])}
  ${line(466, [run(`${t.modes[c.mode].label} · ${t.difficulties[c.difficulty]}`, 24, 400, C.muted)])}
  ${line(526, [run(noEmoji(t.rating(pct)), 36, 700, C.fg)])}
  ${line(590, [run(t.canYouBeat, 26, 600, C.muted), run("  ·  MAPBANGLA", 26, 700, C.accent)])}
</svg>`;
}

export async function renderOgPng(c: Challenge) {
  const shaper = await loadAssets();
  const resvg = new Resvg(buildOgSvg(shaper, c), { font: { loadSystemFonts: false } });
  const image = resvg.render();
  const png = image.asPng();
  // wasm-backed objects aren't garbage-collected
  image.free();
  resvg.free();
  return png;
}
