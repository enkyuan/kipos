import { Elysia } from "elysia";

/** Liveness: the process is up and serving HTTP. */
export const healthRoutes = new Elysia({ name: "health" }).get("/health", () => ({
  status: "ok" as const,
}));
