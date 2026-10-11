import type { Clarification } from "./clarification.js";

// Optional: turn a transcript into a structured answer with Claude. Runs only
// when ANTHROPIC_API_KEY is set; otherwise callers get the raw transcript and
// Claude Code reads it itself. Any failure yields null, never an error, so a
// slow model cannot break a status check or a webhook delivery.
export async function extractAnswer(question: string | null, transcript: string | null) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !transcript) return null;
  const prompt = `An AI assistant contacted a company employee to ask one business question.

Question: ${question ?? "(unknown)"}

Conversation:
${transcript}

Return only a JSON object with these keys:
- "answered": true if the employee gave a usable answer, else false
- "answer": the answer in one or two plain sentences, in the employee's terms, or null
- "business_rules": precise rules stated (each with "condition" and "action"), empty if none
- "open_follow_up": anything still unclear that needs another question, or null`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const object = text.match(/\{[\s\S]*\}/)?.[0];
    return object ? (JSON.parse(object) as unknown) : null;
  } catch {
    return null;
  }
}

// When a clarification finishes, push it to the team knowledge backend so the
// answer becomes company knowledge. Enabled by KNOWLEDGE_INGEST_URL.
export async function forwardToKnowledge(clarification: Clarification) {
  const url = process.env.KNOWLEDGE_INGEST_URL;
  if (!url) return { forwarded: false };
  const token = process.env.KNOWLEDGE_INGEST_TOKEN;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type: "clarification.answered", clarification }),
    });
    return { forwarded: res.ok, status: res.status };
  } catch (cause) {
    return { forwarded: false, error: String(cause) };
  }
}
