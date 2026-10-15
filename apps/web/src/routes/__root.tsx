import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import garamondUrl from "@fontsource-variable/eb-garamond/files/eb-garamond-latin-wght-normal.woff2?url";
import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@kipos/ui/button";
import { color, font, fontSize, fontWeight, space, tracking } from "@kipos/ui/tokens.stylex";
import type { ReactNode } from "react";
import appCss from "../app.css?url";
import { DevAnnotations } from "../dev-annotations";

const styles = stylex.create({
  // Base UI portals render into <body>; isolating the app keeps every popup
  // above page content without z-index bookkeeping.
  root: { isolation: "isolate", minHeight: "100dvh" },
  notFound: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s4,
    minHeight: "100dvh",
    padding: space.s6,
    textAlign: "center",
  },
  notFoundTitle: {
    fontFamily: font.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  notFoundText: { color: color.mutedForeground },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kipos" },
    ],
    links: [
      // The latin files base.css loads: preloading them lets text paint in its
      // own font instead of swapping after the stylesheet is parsed.
      ...[garamondUrl, interUrl].map((href) => ({
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href,
        crossOrigin: "anonymous" as const,
      })),
      { rel: "stylesheet", href: appCss },
      ...(import.meta.env.DEV ? [{ rel: "stylesheet", href: "/virtual:stylex.css" }] : []),
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <main {...stylex.props(styles.notFound)}>
      <h1 {...stylex.props(styles.notFoundTitle)}>Page not found</h1>
      <p {...stylex.props(styles.notFoundText)}>There's nothing at this address.</p>
      <Button variant="outline" render={<Link to="/" />}>
        Back home
      </Button>
    </main>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div {...stylex.props(styles.root)}>{children}</div>
        <DevAnnotations />
        <Scripts />
      </body>
    </html>
  );
}
