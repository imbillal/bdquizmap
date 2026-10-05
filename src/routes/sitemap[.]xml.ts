import { createFileRoute } from "@tanstack/react-router";
import { getOrigin, SITE_PATHS } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const origin = getOrigin();
        const urls = SITE_PATHS.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join("\n");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          { headers: { "content-type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
