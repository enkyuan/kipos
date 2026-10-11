const MEETING_CODE = /^\/([a-z]{3}-[a-z]{4}-[a-z]{3})\/?$/;

/**
 * The canonical form of a Google Meet link (`https://meet.google.com/abc-defg-hij`),
 * or null when `input` is not one. The query string is dropped: parameters
 * like `?authuser=1` pick the viewer's account, not the meeting, and two
 * spellings of one meeting must compare equal.
 */
export function canonicalMeetUrl(input: string): string | null {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const secure = url.protocol === "https:" || url.protocol === "http:";
  if (!secure || url.hostname !== "meet.google.com" || url.port || url.username) return null;
  const code = MEETING_CODE.exec(url.pathname.toLowerCase())?.[1];
  return code ? `https://meet.google.com/${code}` : null;
}

/** The meeting code (`abc-defg-hij`) of a canonical Google Meet link. */
export function meetingCode(canonicalUrl: string): string {
  return canonicalUrl.slice("https://meet.google.com/".length);
}
