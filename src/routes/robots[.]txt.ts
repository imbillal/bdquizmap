import { createFileRoute } from "@tanstack/react-router";

// Served dynamically because the Sitemap line must be an absolute URL on this host.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(
          `User-agent: *\nAllow: /\n\nSitemap: ${new URL(request.url).origin}/sitemap.xml\n`,
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        ),
    },
  },
});
