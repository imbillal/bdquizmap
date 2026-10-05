import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

// Crawlers need absolute URLs (og:image, og:url, sitemap), so resolve the site origin on
// the server too. Uses the request's host, so it works on any domain without config.
export const getOrigin = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true }).origin)
  .client(() => window.location.origin);

/** Default link-preview image, rendered by `npm run generate:og`. */
export const SITE_IMAGE = { path: "/og-image.png", width: 1200, height: 630 };

export const THEME_COLOR = "#0d1611";

/** Pages listed in the sitemap. */
export const SITE_PATHS = ["/", "/quiz", "/explore"];
