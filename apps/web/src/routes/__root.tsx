import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import { Button } from "@nomi/ui/button";
import type { ReactNode } from "react";
import appCss from "../app.css?url";
import { THEME_SCRIPT } from "#features/theme/theme-toggle";
import { DevAnnotations } from "../dev-annotations";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nomi" },
    ],
    links: [
      // The latin file the stylesheet loads: preloading it lets text paint in
      // its own font instead of swapping after the stylesheet is parsed.
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: interUrl,
        crossOrigin: "anonymous" as const,
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-heading-5 text-primary-foreground">Page not found</h1>
      <p className="text-body-base text-secondary-foreground">There's nothing at this address.</p>
      <Button variant="secondary" render={<Link to="/" />}>
        Back home
      </Button>
    </main>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // The theme script adds a class to <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {/* Base UI portals render into <body>; isolating the app keeps every
            popup above page content without z-index bookkeeping. */}
        <div className="isolate min-h-dvh">{children}</div>
        <DevAnnotations />
        <Scripts />
      </body>
    </html>
  );
}
