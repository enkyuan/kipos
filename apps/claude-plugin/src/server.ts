// The Superpower MCP server. Claude Code does the coding; these tools give it
// the client's business context and a way to ask a real employee, by phone
// call or text (Dial), when a business rule is missing.
// It ships bundled (dist/) and runs under plain Node, so no Bun APIs here.
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { flatten, overview, rank, requirementsFor, type Knowledge } from "./knowledge";
import { readSettings, request, SuperpowerError } from "./superpower-api";

const settings = readSettings(process.env);
const knowledge = () => request<Knowledge>(settings, `${settings.knowledgeUrl}/knowledge`);
const clarification = (id: string) =>
  request<Record<string, unknown>>(
    settings,
    `${settings.apiUrl}/clarifications/${encodeURIComponent(id)}`,
  );

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

// Every tool answers with JSON text; a failure becomes an error result Claude
// can read and act on, never a crashed server.
function tool<A>(run: (args: A) => Promise<unknown>) {
  return async (args: A): Promise<ToolResult> => {
    try {
      return { content: [{ type: "text", text: JSON.stringify(await run(args), null, 2) }] };
    } catch (cause) {
      const detail = cause instanceof SuperpowerError ? cause.detail : {};
      const error = cause instanceof Error ? cause.message : String(cause);
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error, ...detail }, null, 2) }],
      };
    }
  };
}

const readOnly = { readOnlyHint: true };
const server = new McpServer({ name: "superpower", version: "0.1.0" });

server.registerTool(
  "get_company_context",
  {
    title: "Get company context",
    description:
      "Overview of the client's business for the current engagement: what the company does, its key processes, pain points, stakeholders, the recommended solution, and open unknowns. Call this first, before planning or writing any code for this client.",
    inputSchema: {},
    annotations: readOnly,
  },
  tool(async () => overview(await knowledge(), settings.engagementId)),
);

server.registerTool(
  "search_knowledge",
  {
    title: "Search company knowledge",
    description:
      "Keyword search across everything known about the client: processes, pain points, requirements, business rules, stakeholders, unknowns, evidence from Slack/email/docs/meetings, and answers from past clarifications. Each result carries its evidence.",
    inputSchema: {
      query: z.string().describe("What you are looking for, e.g. 'legacy contract seat count'"),
      limit: z.number().int().min(1).max(25).optional().describe("Max results (default 8)"),
    },
    annotations: readOnly,
  },
  tool(async ({ query, limit }: { query: string; limit?: number }) => {
    const results = rank(flatten(await knowledge()), query, limit ?? 8);
    const hint =
      "Nothing matched. If the business rule is truly unknown, use request_clarification instead of guessing.";
    return results.length ? { query, results } : { query, results, hint };
  }),
);

server.registerTool(
  "get_requirements",
  {
    title: "Get requirements and business rules",
    description:
      "Company-specific requirements, business rules and exceptions the implementation must follow, with status (confirmed / assumed / conflicting) and evidence, plus answers from past clarifications. Pass a topic to filter. Treat everything under 'unresolved' as NOT settled.",
    inputSchema: {
      topic: z
        .string()
        .optional()
        .describe("Optional filter, e.g. 'approvals', 'legacy contracts', 'discounts'"),
    },
    annotations: readOnly,
  },
  tool(async ({ topic }: { topic?: string }) => requirementsFor(await knowledge(), topic)),
);

server.registerTool(
  "list_stakeholders",
  {
    title: "List contactable stakeholders",
    description:
      "Employees Superpower is authorized to contact for this engagement, with role and expertise. Use it to choose who to ask before request_clarification.",
    inputSchema: {},
    annotations: readOnly,
  },
  tool(() => request(settings, `${settings.apiUrl}/stakeholders`)),
);

const askSchema = {
  channel: z
    .enum(["call", "sms"])
    .optional()
    .describe(
      "'call' (default): AI voice call with follow-ups. 'sms': text message; the reply is the answer.",
    ),
  question: z
    .string()
    .min(10)
    .describe(
      "One specific question in plain business language, e.g. 'Who approves entitlements that are not in any current plan, and above what dollar amount?'",
    ),
  why_it_matters: z
    .string()
    .describe(
      "One or two sentences the agent can share if asked: what is being built and why this answer matters",
    ),
  topic: z
    .string()
    .optional()
    .describe("Short topic used to pick the right person when stakeholder_id is omitted"),
  stakeholder_id: z
    .string()
    .optional()
    .describe("Who to ask (from list_stakeholders); omit to let Superpower pick"),
  follow_ups: z
    .array(z.string())
    .max(3)
    .optional()
    .describe("Up to 3 follow-up questions if the first answer is vague"),
};
type Ask = { [K in keyof typeof askSchema]: z.infer<(typeof askSchema)[K]> };

server.registerTool(
  "request_clarification",
  {
    title: "Ask an employee (phone call or text via Dial)",
    description:
      "Contacts an authorized client employee for REAL, by phone call or text message (via Dial), to ask ONE specific business question the knowledge base cannot answer. Use only after get_requirements and search_knowledge come up empty or conflicting, and only for questions that change what the code does (thresholds, approvers, exceptions, edge cases). The engineer must approve this tool call. Use channel 'call' (default) when the answer is needed soon or needs back-and-forth; 'sms' for a short factual question that can wait. Returns at once with a clarification id; continue independent work, then use check_clarification or wait_for_clarification.",
    inputSchema: askSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: true,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  tool(async ({ why_it_matters, ...ask }: Ask) => {
    const channel = ask.channel ?? "call";
    // The caller introduces the project by the client's name; a knowledge
    // outage must not block the call, so it falls back to the service default.
    const company = (await knowledge().catch(() => null))?.company?.name;
    const c = await request<Record<string, unknown>>(
      settings,
      `${settings.apiUrl}/clarifications`,
      {
        method: "POST",
        body: {
          ...ask,
          channel,
          context: why_it_matters,
          requested_by: settings.requester,
          request_id: randomUUID(),
          company,
        },
      },
    );
    const placed = `${channel === "sms" ? "Text sent" : "Call placed"}. Keep working on parts that do not depend on this answer; isolate the unknown behind one clearly marked TODO. Then call wait_for_clarification (or check_clarification) with this id.`;
    return {
      clarification_id: c.id,
      channel,
      contacting: c.stakeholder,
      status: c.status,
      ...(c.status === "failed" ? { delivery_error: c.delivery_error } : {}),
      next_step: c.status === "failed" ? c.next_step : placed,
    };
  }),
);

server.registerTool(
  "check_clarification",
  {
    title: "Check a clarification",
    description:
      "Status of a clarification (call or text). 'completed' (call) or 'replied' (text) include the transcript or replies, plus a structured answer if the server extracted one. These statuses mean the conversation happened, not that the question was answered: read the employee's words, and implement what they said only if they gave a clear answer.",
    inputSchema: { clarification_id: z.string() },
    annotations: readOnly,
  },
  tool(({ clarification_id }: { clarification_id: string }) => clarification(clarification_id)),
);

const FINISHED = new Set(["completed", "replied", "no_answer", "failed", "canceled"]);

server.registerTool(
  "wait_for_clarification",
  {
    title: "Wait for a clarification",
    description:
      "Blocks until the clarification finishes (call completed, text replied, no answer, or failed) or the timeout passes, checking every 5 seconds. Use when nothing else useful can be done until the answer arrives.",
    inputSchema: {
      clarification_id: z.string(),
      timeout_seconds: z.number().int().min(10).max(300).optional().describe("Default 180"),
    },
    annotations: readOnly,
  },
  tool(
    async ({
      clarification_id,
      timeout_seconds,
    }: {
      clarification_id: string;
      timeout_seconds?: number;
    }) => {
      const deadline = Date.now() + (timeout_seconds ?? 180) * 1000;
      for (;;) {
        const c = await clarification(clarification_id);
        if (FINISHED.has(String(c.status))) return c;
        if (Date.now() >= deadline) {
          return {
            ...c,
            timed_out: true,
            next_step: "Still in progress. Continue other work and check again later.",
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    },
  ),
);

server.registerTool(
  "list_clarifications",
  {
    title: "List clarifications",
    description:
      "Recent clarifications (calls and texts) for this engagement with their status. Use to recover an id or see answers already collected.",
    inputSchema: {},
    annotations: readOnly,
  },
  tool(async () => {
    const { clarifications } = await request<{ clarifications: Record<string, unknown>[] }>(
      settings,
      `${settings.apiUrl}/clarifications`,
    );
    return clarifications.map(({ id, channel, question, stakeholder, status, created_at }) => ({
      id,
      channel,
      question,
      stakeholder: (stakeholder as { name?: string } | null)?.name,
      status,
      created_at,
    }));
  }),
);

await server.connect(new StdioServerTransport());
