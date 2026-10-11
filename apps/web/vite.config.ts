/// <reference types="node" />
import stylex from "@stylexjs/unplugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

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
// development and preview forward it to apps/api. Production puts the same
// rule in front of both apps (docs/architecture.md).
function apiProxy(apiOrigin: string): Record<string, ProxyOptions> {
  return {
    "/api": {
      target: apiOrigin,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
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
  };
});
