import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@ouro/ui/button";
import { color, fontSize, fontWeight, space } from "@ouro/ui/tokens.stylex";
import type { ReactNode } from "react";
import appCss from "../app.css?url";

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
  notFoundTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold },
  notFoundText: { color: color.mutedForeground },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ouro" },
    ],
    links: [
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
      <Button variant="outline" render={<a href="/" />}>
        Back to the home page
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
        <Scripts />
      </body>
    </html>
  );
}
