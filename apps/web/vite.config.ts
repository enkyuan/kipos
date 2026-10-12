/// <reference types="node" />
import stylex from "@stylexjs/unplugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";

// One browser floor for JS and CSS (Chrome/Edge 111, Firefox 121, Safari
// 16.4): every one supports oklch(), color-mix() and :has(), which the
// design system relies on. StyleX runs its own Lightning CSS pass, so it
// gets the same targets.
const browserFloor = ["chrome111", "edge111", "firefox121", "safari16.4"];
const stylexCss = {
  minify: true,
  targets: {
    chrome: 111 << 16,
    edge: 111 << 16,
    firefox: 121 << 16,
    safari: (16 << 16) | (4 << 8),
  },
};

// The browser calls the API on its own origin under /api (src/api/client.ts);
// development and preview forward it, path unchanged, to apps/api, which
// serves the same /api paths. Production puts the same rule in front of
// both apps (docs/architecture.md).
function apiProxy(apiOrigin: string): Record<string, ProxyOptions> {
  return { "/api": { target: apiOrigin, changeOrigin: true } };
}

// Zodiak's file is gitignored (its license forbids redistribution), so CI and
// fresh clones build with the fallback serif. A deploy sets
// REQUIRE_BRAND_FONTS=1 so a build without the file fails instead of shipping
// that fallback and a 404 per page load.
const zodiak = new URL("../../packages/ui/src/fonts/zodiak-variable.woff2", import.meta.url);
function requireBrandFonts(required: boolean): Plugin {
  return {
    name: "require-brand-fonts",
    buildStart() {
      if (required && !existsSync(zodiak)) {
        this.error(`REQUIRE_BRAND_FONTS=1 but ${zodiak.pathname} is missing`);
      }
    },
  };
}

// Plugin order is load-bearing: StyleX and Start both run before the React
// plugin (StyleX to keep Fast Refresh, Start per its setup guide).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = env.API_ORIGIN || "http://localhost:3001";
  // strictPort: a busy port fails loudly instead of moving the app to a port
  // nobody is looking at (or proxying to).
  const port = Number(env.WEB_PORT || 3000);
  return {
    plugins: [
      requireBrandFonts(env.REQUIRE_BRAND_FONTS === "1"),
      // The package's types declare only the default export, so the named
      // `vite` export the linter suggests does not typecheck.
      // oxlint-disable-next-line import/no-named-as-default-member
      stylex.vite({ useCSSLayers: true, lightningcssOptions: stylexCss }),
      tanstackStart(),
      viteReact(),
    ],
    server: { port, strictPort: true, proxy: apiProxy(apiOrigin) },
    preview: { port, strictPort: true, proxy: apiProxy(apiOrigin) },
    build: { target: browserFloor },
    // blode-icons-react's ESM entry imports `./all-icons` without an
    // extension, which Node's resolver refuses when the dev server loads it
    // externally during SSR; bundling it through Vite resolves the path.
    ssr: { noExternal: ["blode-icons-react"] },
  };
});
