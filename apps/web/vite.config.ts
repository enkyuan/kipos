/// <reference types="node" />
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// One browser floor for JS and CSS (Chrome/Edge 111, Firefox 121, Safari
// 16.4): every one supports oklch(), color-mix() and :has(), which the design
// system relies on, and it is Tailwind v4's own floor. No light-dark(): dark
// mode is class-switched variables.
const browserFloor = ["chrome111", "edge111", "firefox121", "safari16.4"];

// Plugin order follows Start's setup guide: Start, then React, then Tailwind.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // strictPort: a busy port fails loudly instead of moving the app to a port
  // nobody is looking at.
  const port = Number(env.WEB_PORT || 3000);
  return {
    plugins: [tanstackStart(), viteReact(), tailwindcss()],
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    build: { target: browserFloor },
  };
});
