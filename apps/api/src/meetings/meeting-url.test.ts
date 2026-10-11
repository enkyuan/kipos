import { expect, test } from "bun:test";
import { canonicalMeetUrl } from "./meeting-url";

test("accepts the spellings people paste and returns one canonical link", () => {
  for (const input of [
    "https://meet.google.com/abc-defg-hij",
    "  https://meet.google.com/abc-defg-hij/ ",
    "https://meet.google.com/ABC-DEFG-HIJ?authuser=1&pli=1",
    "meet.google.com/abc-defg-hij",
    "http://meet.google.com/abc-defg-hij",
  ]) {
    expect(canonicalMeetUrl(input)).toBe("https://meet.google.com/abc-defg-hij");
  }
});

test("rejects anything that is not a Google Meet meeting link", () => {
  for (const input of [
    "",
    "https://meet.google.com/",
    "https://meet.google.com/landing",
    "https://meet.google.com/abc-defg-hij/extra",
    "https://meet.google.com.evil.example/abc-defg-hij",
    "https://user@meet.google.com/abc-defg-hij",
    "javascript://meet.google.com/abc-defg-hij",
    "https://zoom.us/j/123456789",
  ]) {
    expect(canonicalMeetUrl(input)).toBeNull();
  }
});
