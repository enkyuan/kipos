import { Elysia, t } from "elysia";
import { apiError, apiErrorSchema } from "../errors";
import {
  analysisStateSchema,
  businessRequirementSchema,
  candidateIssueSchema,
  type AnalysisState,
  type CandidateIssue,
} from "./contract";
import type { StoredIssue } from "./plan";
import { publicIssue } from "./scheduler";
import type { AnalysisStore } from "./store";

type AnalysisRoutesDeps = {
  store: Pick<AnalysisStore, "requirements" | "issues" | "dismiss" | "save">;
  state: (sessionId: string) => AnalysisState;
  meetingExists: (sessionId: string) => boolean;
  /** The newest utterance id in the meeting: a dismissal's watermark. */
  latestUtteranceId: (sessionId: string) => number;
  publishIssue: (sessionId: string, issue: CandidateIssue) => void;
};

const notFound = (what: string) => apiError("not_found", `No ${what} has this id.`);
const params = t.Object({ id: t.String(), issueId: t.String() });

/**
 * The FDE's private view of a meeting's analysis, and their two actions on
 * an issue. Nothing here reaches the meeting or its participants.
 */
export function analysisRoutes({
  store,
  state,
  meetingExists,
  latestUtteranceId,
  publishIssue,
}: AnalysisRoutesDeps) {
  const announce = (sessionId: string, issue: StoredIssue) => {
    const visible = publicIssue(issue);
    publishIssue(sessionId, visible);
    return visible;
  };
  const actionOptions = { params, response: { 200: candidateIssueSchema, 404: apiErrorSchema } };

  return new Elysia()
    .get(
      "/api/meetings/:id/analysis",
      ({ params: { id }, status }) => {
        if (!meetingExists(id)) return status(404, notFound("meeting session"));
        return {
          state: state(id),
          requirements: store.requirements(id),
          issues: store.issues(id).map(publicIssue),
        };
      },
      {
        response: {
          200: t.Object({
            state: analysisStateSchema,
            requirements: t.Array(businessRequirementSchema),
            issues: t.Array(candidateIssueSchema),
          }),
          404: apiErrorSchema,
        },
      },
    )
    .post(
      "/api/meetings/:id/issues/:issueId/dismiss",
      ({ params: { id, issueId }, status }) => {
        const at = new Date().toISOString();
        const issue = store.dismiss(id, issueId, { latestUtteranceId: latestUtteranceId(id), at });
        return issue ? announce(id, issue) : status(404, notFound("issue"));
      },
      actionOptions,
    )
    .post(
      "/api/meetings/:id/issues/:issueId/save",
      ({ params: { id, issueId }, status }) => {
        const issue = store.save(id, issueId, new Date().toISOString());
        return issue ? announce(id, issue) : status(404, notFound("issue"));
      },
      actionOptions,
    );
}
