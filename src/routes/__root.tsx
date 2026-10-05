import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/SiteHeader";
import { useLang } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { challengeUrl, parseChallenge } from "@/lib/share";
import { getOrigin, SITE_IMAGE, THEME_COLOR } from "@/lib/site";

function NotFoundComponent() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t.notFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.notFoundBody}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const { t } = useLang();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t.errorTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.errorBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.tryAgain}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => ({ origin: getOrigin() }),
  // Site-wide defaults. Routes override any of these by name/property (e.g. /challenge
  // swaps in its result image), so every page shares with a full preview card.
  head: ({ matches, loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const leaf = matches[matches.length - 1];
    // A challenge's URL *is* its content, so keep its query; elsewhere it's just UI state.
    const challenge = leaf?.pathname === "/challenge" ? parseChallenge(leaf.search) : undefined;
    const url = challenge ? challengeUrl(challenge, origin) : `${origin}${leaf?.pathname ?? "/"}`;
    const image = `${origin}${SITE_IMAGE.path}`;
    const imageAlt = "বাংলাদেশ কুইজ ম্যাপ — বাংলাদেশের ৬৪টি জেলার ইন্টারঅ্যাকটিভ ম্যাপ কুইজ";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "বাংলাদেশ কুইজ ম্যাপ" },
        { name: "description", content: "বাংলাদেশকে আপনি কতটা চেনেন? ৬৪টি জেলার ম্যাপ কুইজ।" },
        { name: "theme-color", content: THEME_COLOR },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:site_name", content: "বাংলাদেশ কুইজ ম্যাপ" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "bn_BD" },
        { property: "og:locale:alternate", content: "en_US" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: String(SITE_IMAGE.width) },
        { property: "og:image:height", content: String(SITE_IMAGE.height) },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:alt", content: imageAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: imageAlt },
        {
          "script:ld+json": {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "বাংলাদেশ কুইজ ম্যাপ",
            alternateName: "Bangladesh Quiz Map",
            url: `${origin}/`,
            inLanguage: ["bn", "en"],
          },
        },
      ],
      links: [
        { rel: "canonical", href: url },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap",
        },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Outlet />
      </main>
      <Toaster />
    </QueryClientProvider>
  );
}
