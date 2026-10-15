# Dial service (`@kipos/dial-service`)

Vercel functions that let the Claude Code plugin ask client employees questions through [Dial](https://docs.getdial.ai): an AI voice call or an SMS. See `apps/claude-plugin/README.md` for how it is used.

| Route                                            | Purpose                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `POST /clarifications`                           | Ask one stakeholder one question (`channel`: `call` or `sms`)  |
| `GET /clarifications/:id`, `GET /clarifications` | Status plus the transcript or replies; list for an engagement  |
| `DELETE /clarifications/:id`                     | Hang up or cancel a call                                       |
| `GET /stakeholders`                              | Who may be contacted (no phone numbers)                        |
| `GET /knowledge`                                 | Placeholder company knowledge plus finished clarifications     |
| `POST /dial/webhook`                             | Signed Dial events; forwards answers to `KNOWLEDGE_INGEST_URL` |
| `GET /health`                                    | Which integrations are configured                              |

There's no database: the Dial call or message history is the record. Call metadata rides in the call's instruction, and texts carry a `Ref SP-XXXXX` code. Every route except the webhook needs `Authorization: Bearer $SUPERPOWER_TOKEN`, and every request is scoped to one `engagement_id`. Phone numbers exist only in the server-side `STAKEHOLDERS_JSON`. Environment: `.env.example`.

Deploy from this folder: `npx vercel deploy --prod` (project `superpower-dial-service`). The package has no workspace dependencies on purpose: Vercel's Node builder runs `npm install`, which cannot resolve `workspace:*`. For the same reason the tsconfig extends the shared base by relative path.
