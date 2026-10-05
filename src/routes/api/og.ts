import { createFileRoute } from "@tanstack/react-router";
import { parseChallenge } from "@/lib/share";

// Link-preview image for a shared result. Everything it needs is in the query string.
export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const c = parseChallenge(Object.fromEntries(new URL(request.url).searchParams));
        if (!c) return new Response("Invalid result", { status: 400 });
        try {
          const { renderOgPng } = await import("@/lib/og-image.server");
          const png = await renderOgPng(c);
          return new Response(new Uint8Array(png), {
            headers: {
              "content-type": "image/png",
              // The URL fully determines the image, so it can be cached forever.
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch (error) {
          console.error(error);
          return new Response("Couldn't render image", { status: 500 });
        }
      },
    },
  },
});
