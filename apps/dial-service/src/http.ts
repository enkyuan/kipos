import { timingSafeEqual } from "node:crypto";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function failure(status: number, message: string, extra: object = {}): Response {
  return json({ error: message, ...extra }, status);
}

// This service places real phone calls, so every route except the signed Dial
// webhook needs `Authorization: Bearer $SUPERPOWER_TOKEN`. Returns the
// response to send when the caller is not allowed, or null.
export function denyUnlessAuthorized(request: Request): Response | null {
  const expected = process.env.SUPERPOWER_TOKEN;
  if (!expected) return failure(500, "SUPERPOWER_TOKEN is not configured on the server");
  const given = Buffer.from(
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""),
  );
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return failure(401, "Unauthorized");
  }
  return null;
}

// Every request is scoped to one engagement (one client company), so a coding
// session for one client can never read another client's data.
export function engagementOf(request: Request, body?: { engagement_id?: string }): string {
  const url = new URL(request.url);
  return (
    body?.engagement_id ??
    request.headers.get("x-engagement-id") ??
    url.searchParams.get("engagement_id") ??
    ""
  ).trim();
}

export function lastPathSegment(request: Request): string {
  return decodeURIComponent(new URL(request.url).pathname.split("/").filter(Boolean).at(-1) ?? "");
}
