# Product

Superpower is an AI copilot for Forward Deployed Engineers (FDEs). This file
records only what exists, so nobody builds against an imagined product.

## What exists

- **Meeting shadowing** (`apps/web` `/` and `/meetings/:id`). An FDE pastes
  a Google Meet link, confirms that everyone in the meeting agreed to be
  recorded, and starts a notetaker. A Vexa bot named "Superpower notetaker" asks
  to join as a visible participant; once the host admits it, its finalized,
  speaker-attributed transcript appears live in the workspace and is
  stored. The page shows the provider's actual state (requesting, joining,
  waiting to be admitted, needs help, listening, ended, failed) and why a
  failure happened.
- **Requirements and gaps** (the meeting page's side panel). As the meeting
  runs, Superpower keeps the business requirements heard so far and the gaps that
  would change an implementation decision, each with a suggested question
  and links to the transcript lines behind it. The most important open gap
  is shown as "Ask next". The FDE can save a question or dismiss a gap; a
  later answer in the meeting resolves it. Private to the FDE.

## Who it is for

FDEs who shadow customer meetings and need an accurate record of them.

## Non-goals (for now)

- The notetaker taking part: it never speaks, chats, or contacts anyone.
- Research, outreach (calls, messages), or meeting summaries.
- Accounts, sign-in, or an authenticated surface.
- Meeting platforms other than Google Meet.
- Live captions from partial speech hypotheses: only finalized utterances
  are shown.
