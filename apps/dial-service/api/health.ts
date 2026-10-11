// GET /health: which integrations are configured (never their values).
export function GET(): Response {
  const set = (name: string) => Boolean(process.env[name]);
  return Response.json({
    ok: true,
    service: "dial-service",
    dial_configured: set("DIAL_API_KEY"),
    auth_configured: set("SUPERPOWER_TOKEN"),
    webhook_configured: set("DIAL_WEBHOOK_SECRET"),
    answer_extraction: set("ANTHROPIC_API_KEY"),
    knowledge_forwarding: set("KNOWLEDGE_INGEST_URL"),
  });
}
