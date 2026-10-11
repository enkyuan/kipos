import { Elysia, t } from "elysia";
import { apiErrorSchema } from "../errors";

/**
 * What the waitlist routes need from persistence. Declared here, by its
 * consumer, so the route graph (which `apps/web` type-checks through Eden)
 * never reaches `bun:sqlite`.
 */
export interface WaitlistStore {
  /** Records the email. Joining again with the same email changes nothing. */
  join(email: string): void;
}

/** Emails compare case-insensitively: Ada@example.com and ada@example.com are one entry. */
function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

export function waitlistRoutes(store: WaitlistStore) {
  return new Elysia().post(
    "/v1/waitlist",
    ({ body, status }) => {
      store.join(normalizeEmail(body.email));
      // New and repeated joins answer identically, so the endpoint cannot be
      // used to learn whether an address is already on the list.
      return status(202, { status: "accepted" as const });
    },
    {
      body: t.Object({ email: t.String({ format: "email", maxLength: 254 }) }),
      response: { 202: t.Object({ status: t.Literal("accepted") }), 422: apiErrorSchema },
    },
  );
}
