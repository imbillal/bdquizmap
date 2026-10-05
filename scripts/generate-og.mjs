// Renders the static link-preview image and PNG app icons into public/.
// Run after changing the site card design or the favicon: `npm run generate:og`
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const og = await server.ssrLoadModule("/src/lib/og-image.server.ts");
  const favicon = await readFile("public/favicon.svg", "utf8");
  const outputs = {
    "public/og-image.png": await og.renderSiteOgPng("bn"),
    "public/apple-touch-icon.png": await og.renderSvgPng(favicon, 180),
    "public/icon-192.png": await og.renderSvgPng(favicon, 192),
    "public/icon-512.png": await og.renderSvgPng(favicon, 512),
  };
  for (const [path, png] of Object.entries(outputs)) {
    await writeFile(path, png);
    console.log(`wrote ${path}`);
  }
} finally {
  await server.close();
}
