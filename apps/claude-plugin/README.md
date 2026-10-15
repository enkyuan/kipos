# Superpower for Claude Code (`@kipos/claude-plugin`)

Claude Code does the coding. This plugin gives it the client's business context, and lets it ask a real employee, by **phone call or text (Dial)**, when a business rule is missing, instead of guessing.

```text
Claude Code ── this plugin: MCP server (dist/server.mjs) + skill + SessionStart hook
                 │  Bearer token; engagement_id on every request
                 ├──▶ apps/dial-service (Vercel): POST/GET /clarifications, /stakeholders, mock /knowledge
                 │        └──▶ Dial: AI voice call or SMS ──▶ employee
                 └──▶ knowledge backend: GET /knowledge (dial-service mock until the real one is set)
```

## Install

```bash
bun install && bun run --cwd apps/claude-plugin build      # only after changing src/
claude plugin marketplace add "$(pwd)/apps/claude-plugin"
claude plugin install superpower@kipos
```

Claude Code asks for `api_url` (default: the deployed dial service), `api_token` (ask the team; it's a secret), `engagement_id` (`acme` for the demo) and your name. Change them later with `/plugin`. For a quick trial without installing: `claude --plugin-dir apps/claude-plugin`.

`dist/` is committed on purpose. Claude Code copies the plugin folder when it installs it, so the bundled server has to be in the folder.

## Tools

| Tool                                                                                              | Does                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `get_company_context`                                                                             | Company overview, processes, pain points, stakeholders, recommended solution, open unknowns                                             |
| `search_knowledge(query)`                                                                         | Keyword search over all knowledge, with evidence                                                                                        |
| `get_requirements(topic?)`                                                                        | Requirements and business rules, answers from past clarifications, and everything still `unresolved` (conflicting rules, open unknowns) |
| `list_stakeholders`                                                                               | Who may be contacted (phone numbers never leave the server)                                                                             |
| `request_clarification(question, why_it_matters, channel?, topic?, stakeholder_id?, follow_ups?)` | A real Dial **call** (default) or **sms**. Claude Code asks the engineer to approve each one                                            |
| `check_clarification(id)` / `wait_for_clarification(id)`                                          | Status and the transcript or text replies                                                                                               |
| `list_clarifications`                                                                             | Recent calls and texts for the engagement                                                                                               |

Statuses: `calling` → `in_progress` → `transcribing` → `completed` (calls); `waiting_reply` → `replied` (texts); or `no_answer`, `failed`, `canceled`. `completed` and `replied` only mean the conversation happened. The skill makes Claude check that the person actually answered before it uses anything they said.

`skills/superpower/SKILL.md` is the behaviour contract: read context first, never invent a rule, ask one specific business question, keep working while waiting, implement exactly what the person said, and cite the clarification id in the code.

## Knowledge backend contract

Set the plugin's `knowledge_url` to the team backend once it serves `GET /knowledge?engagement_id=<id>` (with `Authorization: Bearer <token>`). It returns the shape in `apps/dial-service/src/mock-knowledge.ts` (`Knowledge`): `company`, `processes`, `pain_points`, `requirements`, `business_rules` (`status`: confirmed / assumed / conflicting), `stakeholders`, `unknowns`, `opportunities`, `recommended_solution`, `clarifications`. Each item has an `id` and `evidence`.

To receive answers, set `KNOWLEDGE_INGEST_URL` on the dial service. It POSTs `{ "type": "clarification.answered", "clarification": {...} }` when a call is transcribed or a text gets a reply.

## Limits

- The Dial number isn't 10DLC-registered, so US carriers reject texts (the service reports `failed` with the carrier's reason). Use calls until the number is registered.
- Free Dial accounts: calls of at most 5 minutes (we cap at 3), and 2 calls at once.
