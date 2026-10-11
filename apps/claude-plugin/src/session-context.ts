// SessionStart hook: tell Claude Code which client engagement this session is
// for, so it reaches for Superpower before guessing business logic. Runs under
// plain Node. It must never block a session: any failure prints nothing.
import { sessionBriefing, type Knowledge } from "./knowledge";
import { readSettings, request } from "./superpower-api";

// Hooks receive plugin options as CLAUDE_PLUGIN_OPTION_<KEY>.
const opt = (key: string) => process.env[`CLAUDE_PLUGIN_OPTION_${key}`];
const settings = readSettings({
  SUPERPOWER_API_URL: opt("API_URL"),
  SUPERPOWER_KNOWLEDGE_URL: opt("KNOWLEDGE_URL"),
  SUPERPOWER_TOKEN: opt("API_TOKEN"),
  SUPERPOWER_ENGAGEMENT_ID: opt("ENGAGEMENT_ID"),
});

try {
  const k = await request<Knowledge>(settings, `${settings.knowledgeUrl}/knowledge`, {
    signal: AbortSignal.timeout(4000),
  });
  const additionalContext = sessionBriefing(k, settings.engagementId);
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }),
  );
} catch {
  // No briefing is better than a broken session start.
}
