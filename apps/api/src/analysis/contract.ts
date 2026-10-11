import { t, type Static } from "elysia";

const evidence = t.Array(t.Integer(), {
  description: "Ids of the transcript utterances that support this record.",
});

export const businessRequirementSchema = t.Object({
  id: t.String(),
  meetingSessionId: t.String(),
  description: t.String(),
  /**
   * `proposed`: extracted from the conversation. `confirmed`: a participant
   * explicitly confirmed it (`confirmationUtteranceIds`), never inferred.
   * `superseded`: replaced by `supersededBy`.
   */
  status: t.UnionEnum(["proposed", "confirmed", "superseded"]),
  evidenceUtteranceIds: evidence,
  confirmationUtteranceIds: evidence,
  supersededBy: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type BusinessRequirement = Static<typeof businessRequirementSchema>;

export const ISSUE_TYPES = [
  "missing_business_rule",
  "ambiguous_requirement",
  "conflicting_requirement",
  "missing_integration_detail",
  "unresolved_ownership",
  "external_dependency",
] as const;

export const candidateIssueSchema = t.Object({
  id: t.String(),
  meetingSessionId: t.String(),
  type: t.UnionEnum(ISSUE_TYPES),
  summary: t.String(),
  implementationImpact: t.String(),
  suggestedQuestion: t.String(),
  suggestedOwner: t.Nullable(t.String()),
  /** The original evidence; kept when the issue is resolved. */
  evidenceUtteranceIds: evidence,
  /** The utterances that answered it, once `resolved`. */
  resolutionUtteranceIds: evidence,
  priority: t.UnionEnum(["low", "medium", "high"]),
  status: t.UnionEnum(["open", "dismissed", "resolved"]),
  /** When the FDE saved the suggested question. */
  savedAt: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type CandidateIssue = Static<typeof candidateIssueSchema>;

/** Whether analysis runs for this deployment, and how the last cycle went. */
export const analysisStateSchema = t.Object({
  enabled: t.Boolean(),
  state: t.UnionEnum(["idle", "analyzing", "failed"]),
  analyzedAt: t.Nullable(t.String()),
});

export type AnalysisState = Static<typeof analysisStateSchema>;
