// Placeholder company knowledge, served until the team knowledge backend is live.
// Its shape is the contract the Claude Code plugin reads (GET /knowledge);
// the real backend returns the same keys.

export const MOCK_KNOWLEDGE: Record<string, Knowledge> = {
  acme: {
    engagement_id: "acme",
    company: {
      name: "Acme Corporation",
      industry: "B2B industrial software (equipment monitoring subscriptions)",
      size: "~900 employees",
      summary:
        "Acme sells equipment-monitoring subscriptions to manufacturers. New customers are onboarded by Operations after Sales closes the deal. About 40% of customers are still on legacy contracts signed before the 2023 pricing change, and their entitlements are reconciled by hand.",
    },
    processes: [
      {
        id: "proc-onboarding",
        name: "Customer onboarding",
        owner: "Operations",
        steps: [
          "Sales closes the deal in Salesforce and emails the signed contract PDF to Operations",
          "Operations reads the contract and enters entitlements (seat count, modules, support tier) into the billing system by hand",
          "Customer Success schedules the kickoff once entitlements are live",
        ],
        evidence: ["slack:#ops-onboarding 2026-09-14", "doc:Onboarding SOP v3"],
      },
      {
        id: "proc-legacy-reconciliation",
        name: "Legacy contract reconciliation",
        owner: "Finance Operations",
        steps: [
          "Each month Finance exports billing entitlements to a spreadsheet",
          "An analyst compares them against the legacy contract PDFs",
          "Mismatches are emailed to Operations to fix",
        ],
        evidence: ["doc:Month-end close checklist", "meeting:kickoff 2026-10-09"],
      },
    ],
    pain_points: [
      {
        id: "pain-handoff",
        statement:
          "Sales-to-Ops handoff takes 6 business days on average; customers wait to go live.",
        impact: "high",
        evidence: ["slack:#ops-onboarding", "meeting:kickoff 2026-10-09"],
      },
      {
        id: "pain-entitlement-errors",
        statement:
          "About 1 in 8 legacy contracts has wrong entitlements in billing, causing over- or under-billing.",
        impact: "high",
        evidence: ["doc:Q3 billing audit"],
      },
      {
        id: "pain-manual-review",
        statement: "Finance spends ~3 analyst-days per month on manual reconciliation.",
        impact: "medium",
        evidence: ["meeting:kickoff 2026-10-09"],
      },
    ],
    requirements: [
      {
        id: "req-extract",
        statement:
          "Extract seat count, modules, support tier, start date and term from contract PDFs.",
        status: "confirmed",
        evidence: ["meeting:kickoff 2026-10-09"],
      },
      {
        id: "req-legacy-flag",
        statement:
          "Legacy contracts (signed before 2023-04-01) must be flagged and handled with legacy pricing rules.",
        status: "confirmed",
        evidence: ["doc:Pricing change memo 2023"],
      },
      {
        id: "req-exception-queue",
        statement:
          "Anything that cannot be mapped automatically goes to a human exception-review queue; nothing is silently dropped.",
        status: "confirmed",
        evidence: ["meeting:kickoff 2026-10-09"],
      },
      {
        id: "req-audit",
        statement:
          "Every entitlement change needs an audit record: who, when, source contract, before and after.",
        status: "confirmed",
        evidence: ["doc:Finance controls policy"],
      },
    ],
    business_rules: [
      {
        id: "rule-legacy-seats",
        rule: "Legacy contracts keep their contracted seat count even if the current plan's minimum is higher.",
        condition: "contract.signed_at < 2023-04-01",
        action: "seats = contract.seats (do not apply current plan minimum)",
        status: "confirmed",
        evidence: ["doc:Pricing change memo 2023"],
      },
      {
        id: "rule-support-tier",
        rule: "Legacy 'Gold' support maps to the current 'Premium' tier.",
        condition: "contract.support_tier == 'Gold'",
        action: "support_tier = 'Premium'",
        status: "confirmed",
        evidence: ["slack:#finance-ops 2026-08-02"],
      },
      {
        id: "rule-discount-cap",
        rule: "Discounts above 25% need approval.",
        condition: "contract.discount_pct > 25",
        action: "route to approval",
        status: "conflicting",
        evidence: ["doc:Sales playbook (says 25%)", "email:CFO 2026-06 (says 20%)"],
      },
    ],
    stakeholders: [
      {
        id: "ops-manager",
        name: "Jordan Lee",
        role: "Operations Manager",
        owns: ["customer onboarding", "entitlement entry"],
      },
      {
        id: "finance-manager",
        name: "Akshat Gopalan",
        role: "Finance Manager",
        owns: ["reconciliation", "approvals", "discounts", "billing"],
      },
      {
        id: "cs-lead",
        name: "Marcus Diaz",
        role: "Customer Success Lead",
        owns: ["kickoffs", "customer communication"],
      },
    ],
    unknowns: [
      {
        id: "gap-nonstandard-approval",
        question:
          "Who approves nonstandard entitlements (modules or seats not in any current plan), and is there a dollar threshold?",
        why_it_matters:
          "The exception queue needs an approval route; without it, exceptions sit unowned.",
        likely_owner: "finance-manager",
        status: "open",
      },
      {
        id: "gap-discount-threshold",
        question: "Is the discount approval threshold 20% or 25%?",
        why_it_matters:
          "Sources conflict; the wrong threshold either blocks valid deals or lets bad ones through.",
        likely_owner: "finance-manager",
        status: "open",
      },
    ],
    opportunities: [
      {
        id: "opp-legacy-reconciliation",
        title: "Automate legacy contract reconciliation",
        rationale:
          "Based on onboarding records and Operations interviews: removes ~3 analyst-days/month and the 1-in-8 error rate.",
        suggested_implementation:
          "Contract extraction + entitlement mapping + exception review queue",
      },
    ],
    recommended_solution: {
      title: "Contract-to-entitlement service",
      components: [
        "PDF contract extractor (LLM-assisted, outputs a typed Contract object)",
        "Entitlement mapper applying confirmed business rules (legacy vs current pricing)",
        "Exception review queue with an approval route",
        "Audit log for every entitlement change",
      ],
      integrations: [
        "Salesforce (closed-won trigger)",
        "Billing system API (write entitlements)",
        "Slack (#ops-onboarding notifications)",
      ],
      out_of_scope: ["Changing customer pricing", "Rewriting the billing system"],
    },
  },
};

type Evidence = { evidence?: string[] };

export type Knowledge = {
  engagement_id: string;
  company: { name: string; industry?: string; size?: string; summary?: string };
  processes: ({ id: string; name: string; owner: string; steps: string[] } & Evidence)[];
  pain_points: ({ id: string; statement: string; impact: string } & Evidence)[];
  requirements: ({ id: string; statement: string; status: string } & Evidence)[];
  business_rules: ({
    id: string;
    rule: string;
    condition: string;
    action: string;
    status: string;
  } & Evidence)[];
  stakeholders: { id: string; name: string; role: string; owns: string[] }[];
  unknowns: {
    id: string;
    question: string;
    why_it_matters: string;
    likely_owner: string;
    status: string;
  }[];
  opportunities: {
    id: string;
    title: string;
    rationale: string;
    suggested_implementation: string;
  }[];
  recommended_solution: {
    title: string;
    components: string[];
    integrations: string[];
    out_of_scope: string[];
  };
};
