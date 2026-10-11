import { afterEach, describe, expect, test } from "bun:test";
import { bestMatch, directory, engagementForPhone, publicView } from "./stakeholders";

const finance = {
  id: "finance",
  name: "A",
  role: "Finance Manager",
  phone: "+1555",
  expertise: ["approvals", "discounts"],
};
const ops = {
  id: "ops",
  name: "B",
  role: "Operations Manager",
  phone: "+1666",
  expertise: ["onboarding"],
};
const revoked = { id: "old", name: "C", role: "Former Lead", phone: "+1777", authorized: false };

afterEach(() => {
  delete process.env.STAKEHOLDERS_JSON;
});

describe("stakeholder directory", () => {
  test("lists only authorized people, per engagement", () => {
    process.env.STAKEHOLDERS_JSON = JSON.stringify({ acme: [finance, revoked], globex: [ops] });
    expect(directory("acme").map((p) => p.id)).toEqual(["finance"]);
    expect(directory("nobody")).toEqual([]);
  });

  test("routes a question to the person whose expertise overlaps it", () => {
    expect(bestMatch([finance, ops], "approvals for discounts")?.id).toBe("finance");
    expect(bestMatch([finance, ops], "customer onboarding")?.id).toBe("ops");
    expect(bestMatch([finance, ops], "weather")).toBeUndefined();
  });

  test("hides phone numbers from callers", () => {
    expect(publicView(finance)).not.toHaveProperty("phone");
    expect(publicView(finance).phone_on_file).toBe(true);
  });

  test("ties an inbound text to the engagement of an authorized sender only", () => {
    process.env.STAKEHOLDERS_JSON = JSON.stringify({ acme: [finance, revoked] });
    expect(engagementForPhone("+1555")).toBe("acme");
    expect(engagementForPhone("+1777")).toBeUndefined();
  });
});
