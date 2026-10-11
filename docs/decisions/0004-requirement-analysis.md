# 0004 — Live requirement extraction and gap detection

Status: accepted (2026-10-11)

## Context

From the live transcript, maintain the client's business requirements and
the gaps that would change an implementation decision, with suggested
questions, for the FDE only. The model is fallible and the transcript is
untrusted.

## Decisions

1. **Incremental, batched, one at a time per meeting.** The ingestion path
   tells the scheduler when a meeting gains utterances. It batches the
   utterances past the meeting's cursor (`analysis_cursors`) once they span
   about 25 s of speech, have waited 30 s, or the meeting has ended. One
   cycle per meeting runs at a time (an in-process lock); utterances that
   arrive meanwhile wait for the next.
2. **Bounded context.** Each cycle sends the recorded requirements and
   issues, the 30 utterances before the batch, and the batch; never the
   whole transcript.
3. **Structured output by forced tool use.** Claude (`ANALYSIS_MODEL`,
   default `claude-sonnet-5-5`) must answer through one tool,
   `record_analysis`, whose schema is the TypeBox `modelOutputSchema`. The
   tool has no effect; its input is validated with the same schema.
4. **The model proposes; code decides** (`analysis/plan.ts`):
   - evidence must be existing utterance ids of this meeting, or the record is rejected;
   - a repeated issue (same `ref`, or same type with similar wording) updates the original;
   - a resolution keeps the original evidence and adds the answering utterances;
   - an issue for a question already answered is never created;
   - a dismissed issue returns only with evidence newer than its dismissal;
   - a requirement is `confirmed` only with a participant's explicit confirmation cited, never inferred.
5. **Failure is contained.** Invalid output or a model error is logged; the
   transcript is untouched and nothing is written. Invalid output is
   retried once, then its batch is skipped (it remains in later cycles'
   context). An unreachable model is retried with backoff (10 s doubling to
   2 min) and its batch is never skipped.
6. **The FDE's decisions win races.** A dismissal made while a cycle is
   running is re-checked inside the cycle's write; it stands unless the
   cycle cites evidence newer than it.
7. **Prompt injection.** Transcript lines are quoted as JSON objects, one
   per line, under labelled sections; recorded requirements and issues are
   labelled as derived data too; the system prompt says the transcript is
   data. The model is offered no tool that acts.
8. **Private by construction.** Analysis is published only on the FDE's
   live channel. Nothing is sent to the meeting, and no research is run.

## Consequences

- Analysis needs `ANTHROPIC_API_KEY`; without it the transcript works and
  the panel says analysis is off.
- Word-similarity dedupe is a backstop for the model's own `ref`s; it can
  miss paraphrases with little word overlap.
- The lock is in-process: one API process per database.
