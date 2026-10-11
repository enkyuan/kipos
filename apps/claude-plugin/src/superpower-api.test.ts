import { describe, expect, test } from "bun:test";
import { readSettings } from "./superpower-api";

describe("plugin settings", () => {
  test("treat an unset Claude Code option reference as empty", () => {
    const s = readSettings({
      SUPERPOWER_API_URL: "https://svc.example/",
      SUPERPOWER_KNOWLEDGE_URL: "${user_config.knowledge_url}",
    });
    expect(s.apiUrl).toBe("https://svc.example");
    expect(s.knowledgeUrl).toBe("https://svc.example");
  });

  test("read knowledge from the team backend once it is configured", () => {
    const s = readSettings({
      SUPERPOWER_API_URL: "https://svc.example",
      SUPERPOWER_KNOWLEDGE_URL: "https://kb.example",
    });
    expect(s.knowledgeUrl).toBe("https://kb.example");
  });

  test("default to the demo engagement", () => {
    expect(readSettings({}).engagementId).toBe("acme");
  });
});
