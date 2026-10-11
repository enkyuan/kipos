import { apiClient } from "#api/client";

export type JoinOutcome =
  | { kind: "joined" }
  | { kind: "invalid"; message: string }
  | { kind: "unavailable"; message: string };

/**
 * Asks the API to add `email` to the waitlist and says what the person
 * should see. The API answers new and repeat joins alike (202), so both are
 * simply "joined".
 */
export async function joinWaitlist(email: string): Promise<JoinOutcome> {
  try {
    const { error } = await apiClient().v1.waitlist.post({ email: email.trim() });
    if (!error) return { kind: "joined" };
    if (error.status === 422) {
      return { kind: "invalid", message: "Enter a valid email address." };
    }
  } catch {
    // A network failure lands here; it reads the same as a 5xx to the person.
  }
  return { kind: "unavailable", message: "We couldn't add you right now. Try again in a moment." };
}
