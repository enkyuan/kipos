import { Elysia, t, type Static } from "elysia";

/**
 * The one error shape every non-2xx response carries. Routes declare it per
 * failure status (`response: { 422: apiErrorSchema }`), so the Eden client
 * types each failure and a mismatched body fails response validation.
 *
 * @public for the first feature route; the health route has no failures.
 */
export const apiErrorSchema = t.Object({
  error: t.Object({ code: t.String(), message: t.String() }),
});

export type ApiError = Static<typeof apiErrorSchema>;

export const apiError = (code: string, message: string): ApiError => ({ error: { code, message } });

/**
 * Maps every failure to an `ApiError`:
 * - a bad request (body, query, params) is 422 with the first problem;
 * - a response that fails its own schema is our bug, so 500, not the client's;
 * - `throw status(code, apiError(...))` keeps its status and body;
 * - anything else is a 500 whose cause is logged here, once, and never echoed.
 */
export const errorBoundary = new Elysia({ name: "error-boundary" }).onError(
  { as: "global" },
  ({ code, error, set }) => {
    if (typeof code === "number") {
      set.status = code;
      const body = "response" in error ? error.response : undefined;
      return isApiError(body) ? body : apiError("error", "The request could not be completed.");
    }
    switch (code) {
      case "VALIDATION":
        if (error.type !== "response") {
          set.status = 422;
          return apiError("invalid_request", error.all[0]?.summary ?? "The request is invalid.");
        }
        break;
      case "NOT_FOUND":
        set.status = 404;
        return apiError("not_found", "No route matches this request.");
      case "PARSE":
        set.status = 400;
        return apiError("malformed_request", "The request body could not be parsed.");
    }
    console.error(error);
    set.status = 500;
    return apiError("internal", "Something went wrong on our side.");
  },
);

function isApiError(value: unknown): value is ApiError {
  const inner = (value as ApiError | undefined)?.error;
  return typeof inner?.code === "string" && typeof inner.message === "string";
}
