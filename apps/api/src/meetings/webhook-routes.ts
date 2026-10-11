import { createHash } from "node:crypto";
import { Elysia, t } from "elysia";
import { apiError, apiErrorSchema } from "../errors";
import { verifyVexaSignature } from "./signature";

/** What the webhook needs from the delivery inbox. */
export interface DeliveryInbox {
  accept(id: string, payload: string, receivedAt: string): boolean;
}

type ProviderWebhookDeps = {
  /** The shared secret set with Vexa's `PUT /user/webhook`; empty rejects every delivery. */
  secret: string;
  inbox: DeliveryInbox;
  /** Called after a delivery is stored; processing must not delay the acknowledgement. */
  onAccepted: () => void;
};

/** The provider's event id, or a digest of the body when it has none. */
function deliveryId(body: string): string {
  try {
    const id = (JSON.parse(body) as { event_id?: unknown }).event_id;
    if (typeof id === "string" && id) return id;
  } catch {
    // Not JSON: still stored, and recorded as failed when processed.
  }
  return `sha256:${createHash("sha256").update(body).digest("hex")}`;
}

/**
 * `POST /api/webhooks/vexa`: signed lifecycle webhooks. Verifies the
 * signature over the raw body before reading anything, stores the delivery,
 * and acknowledges; ingestion runs afterwards. A repeated delivery (same
 * event id) is acknowledged again and stored once.
 */
export function providerWebhookRoutes({ secret, inbox, onAccepted }: ProviderWebhookDeps) {
  return new Elysia().post(
    "/api/webhooks/vexa",
    async ({ request, status }) => {
      const body = await request.text();
      const nowSeconds = Date.now() / 1000;
      if (!verifyVexaSignature({ secret, headers: request.headers, body, nowSeconds })) {
        throw status(401, apiError("invalid_signature", "The request signature did not verify."));
      }
      inbox.accept(deliveryId(body), body, new Date().toISOString());
      onAccepted();
      return { received: true as const };
    },
    {
      // The signature covers the exact bytes; Elysia must not parse them first.
      parse: "none",
      response: { 200: t.Object({ received: t.Literal(true) }), 401: apiErrorSchema },
    },
  );
}
