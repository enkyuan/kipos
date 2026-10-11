---
description: Build a client feature with Superpower, asking a stakeholder by phone for any business rule that is missing
argument-hint: <what to build>
---

Build this for the client: $ARGUMENTS

Follow the superpower skill exactly, in this order:

1. Call `get_company_context`, then `get_requirements` for this feature's area, and `search_knowledge` for its key terms.
2. List the business decisions this feature needs: thresholds, approvers, mappings, exceptions. For each one, say whether it is confirmed (cite the rule id) or unresolved (missing, conflicting, an open unknown, or only asked before without a clear answer).
3. For every unresolved decision this feature depends on, call `request_clarification` now (`channel: "call"`, addressed to the unknown's likely owner). Do this before writing the logic that depends on it. Don't ask me first; I'll approve the call in the permission prompt.
4. While the call runs, build everything else: types, the queue, wiring, tests for the confirmed rules. Isolate each unknown behind a `TODO(superpower:<clarification_id>)`.
5. Call `wait_for_clarification`. When the person gives a clear answer, implement it exactly, cite them and the clarification id in a comment, and add tests for the rule and its boundaries. If they don't answer clearly, tell me and leave the TODO in place.
6. Run the tests. Finish with a short summary: the rules used, where each came from, and anything still open.
