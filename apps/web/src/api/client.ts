import { treaty } from "@elysiajs/eden";
import type { App } from "@ouro/api";

/**
 * The typed boundary to apps/api. Routes, bodies and responses come from
 * the API's own types, so a contract change fails `bun run typecheck` here.
 *
 * Browser only: requests go to this origin's /api, which the dev server
 * (and the production proxy) forwards to apps/api.
 */
export function apiClient() {
  return treaty<App>(window.location.origin);
}
