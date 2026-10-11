---
name: superpower
description: Use whenever you plan, build, or change software for the current client engagement, especially business logic (approvals, pricing, entitlements, contracts, billing, onboarding, thresholds, exceptions, who-does-what). Gives you the client's business context and lets you ask a real employee by phone call or text message (Dial) when a business rule is missing, instead of guessing.
---

# Superpower: client business context for coding

You are building software for a client company. You know how to write code; Superpower knows the client's business. Its knowledge comes from the client's Slack, email, documents, meetings and phone interviews. **Never invent business rules.** A wrong guess here becomes a billing error or a blocked customer.

## Tools (MCP server `superpower`)

| Tool                                                     | Use it to                                                                                                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_company_context`                                    | Learn what the company does, its processes, pain points, stakeholders, the recommended solution, and the open unknowns. Call it **first**.                |
| `get_requirements(topic?)`                               | Get the requirements and business rules the code must follow, including answers from past calls.                                                          |
| `search_knowledge(query)`                                | Find specific facts, with evidence (Slack, email, docs, meetings, calls).                                                                                 |
| `list_stakeholders`                                      | See who Superpower is authorized to call, and their roles and expertise.                                                                                  |
| `request_clarification(...)`                             | Ask one employee one question, by **real** phone call (`channel: "call"`, the default) or text message (`channel: "sms"`). Needs the engineer's approval. |
| `check_clarification(id)` / `wait_for_clarification(id)` | Get the status and the answer: a call transcript or the text replies.                                                                                     |
| `list_clarifications`                                    | Recover clarification ids, or see the answers already collected.                                                                                          |

## Workflow

1. **Start of a task:** call `get_company_context`, then `get_requirements` for the area you are touching. Briefly tell the engineer which rules you will follow, citing their ids.
2. **While building:** whenever the code needs a business decision (a threshold, an approver, a mapping, an exception, an edge case), look it up with `get_requirements(topic)` or `search_knowledge`.
3. **The rule is missing, ambiguous, or `conflicting`, or it appears under `unresolved`/`unknowns`:**
   - Do not pick a value yourself, and do not hard-code a "reasonable default".
   - Check `list_clarifications`: if someone already got a clear answer, use it (step 5). A past attempt that ended without an answer (no answer, cut short, "I don't know", failed text) is not an answer: ask again.
   - **Then call `request_clarification` right away.** Don't stop to ask the engineer whether to call: Claude Code shows them an approval prompt for this tool, and that prompt is their authorization. Never end your turn with the rule still unknown and no clarification in flight.
   - Call `request_clarification` with:
     - `channel`: `call` for a decision you need now, or one that may need follow-ups (thresholds, approval chains); `sms` for a short factual question that can wait. If the engineer says how to reach people, do that;
     - **one** specific question in business language, not code terms;
     - `why_it_matters`: one or two sentences on what you are building;
     - a `topic`, or a `stakeholder_id` from `list_stakeholders` (prefer the likely owner named in the unknown);
     - up to 3 `follow_ups` that pin down numbers, approvers and exceptions.
   - Tell the engineer, in one line, who is being called or texted, and why.
4. **While waiting (asynchronous):** keep building everything that does not depend on the answer. Isolate the unknown behind one clearly named function or config value, with a `// TODO(superpower:<clarification_id>)` comment. Then call `wait_for_clarification`, or call `check_clarification` between other steps.
5. **When `status` is `completed` (call) or `replied` (text):** read the transcript or the text replies (and `answer`, if present). These statuses only mean the conversation happened. First check that the employee actually answered the question. If they did, implement exactly what they said. Put a short comment at the rule citing the source, e.g. `// Rule from Akshat Gopalan (Finance Manager), clarification <id>`. Add a test for the rule and its boundary values. Tell the engineer what you learned in one or two lines.
   - If they did not answer (they didn't know, deflected, or the call was cut short), treat it like `no_answer` (step 6). If the answer is vague, or raises a new question, ask one follow-up clarification. Don't stretch the answer to cover the gap.
6. **`no_answer`, `failed` or `canceled`:** tell the engineer, and leave the TODO in place. A failed text: retry once as a call. Anything else: ask whether to retry, switch channel or try someone else. A text stuck at `waiting_reply` for a long time works the same way. Never fill in the rule yourself.

## Asking good questions

- Good: "When an entitlement isn't in any current plan, who has to approve it, and is there a dollar amount above which someone more senior must sign off?"
- Bad: "What should `approveEntitlement()` return?" (code terms), or "Tell me about approvals" (too broad).
- Ask one decision per call. Ask about the business, not the implementation.
