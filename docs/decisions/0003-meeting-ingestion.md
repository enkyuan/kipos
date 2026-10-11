# 0003 — Meeting ingestion through Vexa

Status: accepted (2026-10-11). Replaces an unshipped Recall.ai draft, at
the owner's choice of a provider that needs no business account: Vexa is
self-serve (hosted with free credit, or self-hosted, Apache-2.0).

## Context

The FDE workspace must shadow a real Google Meet and show its transcript
live, with no duplicate or misordered lines, an honest status, server-side
keys, and the smallest stack that does it.

## Decisions

1. **A Vexa bot per session** (`POST /bots`: `google_meet`, the meeting
   code, `bot_name: "Ouro notetaker"`, `language: "en"`,
   `recording_enabled: false`). The bot asks to join; the host admits it.
   It leaves after 2 minutes without remote audio
   (`automatic_leave.max_time_left_alone`; Vexa's default of 10 minutes
   kept it in ended calls), so a meeting that falls fully silent that
   long also loses it.
   It never speaks or chats.
2. **Pull, not push, for the transcript.** The API holds one WebSocket
   subscription to Vexa's `/ws` per live session (authenticated with the
   API key, so no public endpoint is needed). Only confirmed segments
   (`confirmed[]`, `completed: true`) are stored; drafts are speech
   hypotheses and are never stored. Drafts are forwarded to open live
   channels as `draft` events (one speaker's words in progress, replaced
   by each frame of that speaker's bundle), so the transcript shows speech
   as it happens without a hypothesis entering the record.
3. **Catch-up by REST.** The transcript record (by Vexa meeting id when
   known, else by meeting code, ignoring a record of an earlier meeting on a
   recurring code) is read on every (re)subscribe, when the stream reports
   the meeting ended (for its `completion_reason`), and every 15 s. A gap in the stream, or a frame
   shape this reader does not know, delays a line; it never loses one.
4. **Deduplication by Vexa's `segment_id`** (`UNIQUE (session, dedup_key)`):
   a segment delivered by the stream, a catch-up, or a reconnect is one row.
5. **Status from all reports, not the last one.** Every status report (from
   the stream, a catch-up, or a webhook) is stored; the session status is a
   function of the set: any failure wins, then completion, then the latest
   live state by the provider's timestamp. Delivery order cannot change it.
   Only Vexa's `active` shows "Listening".
6. **Optional signed webhooks** (`POST /api/webhooks/vexa`, HMAC-SHA256 over
   `<timestamp>.<raw body>`, five-minute window) as a second lifecycle path.
   A verified delivery is stored (by `event_id`) before the 200 and
   processed after; failed deliveries keep their payload and are retried at
   startup.
7. **Ambiguity is not failure.** A definite refusal (401/403/409/422/429/503)
   fails the session; a timeout or 5xx leaves it `requested` with a note,
   still watched, so a bot that joins anyway is followed and a retry does
   not send a second one. A session Vexa says nothing about for five minutes
   is failed by its watcher; a live session silent for two minutes (never
   heard from) or six hours is replaced by a new start. A session failed
   locally stays failed whatever its bot reports later, and a webhook that
   names a Vexa meeting id matches only that id.
8. **SSE to the browser.** The stream replays persisted state on connect;
   clients merge by id and rebuild a closed `EventSource` with backoff.
9. **The API serves `/api/...` itself**, so browser, dev proxy and webhook
   use the same paths. The landing page and waitlist were removed
   (`20261011010000_drop_waitlist.sql`).

## Consequences

- Speaker attribution is Vexa's (text-level binding); an unattributed
  segment is stored with a null speaker and shown as "Unknown speaker".
- Single API process: the watcher, the live feed and the inbox are
  in-process.
