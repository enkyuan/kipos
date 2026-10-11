import type { Database } from "bun:sqlite";
import type { BusinessRequirement } from "./contract";
import type { StoredIssue } from "./plan";

type RequirementRow = Omit<
  BusinessRequirement,
  "evidenceUtteranceIds" | "confirmationUtteranceIds"
> & {
  evidence: string;
  confirmation: string;
};
type IssueRow = Omit<StoredIssue, "evidenceUtteranceIds" | "resolutionUtteranceIds"> & {
  evidence: string;
  resolution: string;
};

const REQUIREMENT_COLUMNS = `id, meeting_session_id AS meetingSessionId, description, status,
  evidence_utterance_ids AS evidence, confirmation_utterance_ids AS confirmation,
  superseded_by AS supersededBy, created_at AS createdAt, updated_at AS updatedAt`;

const ISSUE_COLUMNS = `id, meeting_session_id AS meetingSessionId, type, summary,
  implementation_impact AS implementationImpact, suggested_question AS suggestedQuestion,
  suggested_owner AS suggestedOwner, evidence_utterance_ids AS evidence,
  resolution_utterance_ids AS resolution, priority, status,
  dismissed_at_utterance_id AS dismissedAtUtteranceId, saved_at AS savedAt,
  created_at AS createdAt, updated_at AS updatedAt`;

const toRequirement = ({
  evidence,
  confirmation,
  ...row
}: RequirementRow): BusinessRequirement => ({
  ...row,
  evidenceUtteranceIds: JSON.parse(evidence) as number[],
  confirmationUtteranceIds: JSON.parse(confirmation) as number[],
});

const toIssue = ({ evidence, resolution, ...row }: IssueRow): StoredIssue => ({
  ...row,
  evidenceUtteranceIds: JSON.parse(evidence) as number[],
  resolutionUtteranceIds: JSON.parse(resolution) as number[],
});

/** Requirements, issues and the per-meeting analysis cursor in SQLite. */
export function createAnalysisStore(db: Database) {
  return {
    ...readQueries(db),
    ...decisionQueries(db),
    /**
     * Writes one cycle's records and moves the cursor, all or nothing.
     * Returns the issues actually written (see `commitCycle`).
     */
    commit: (sessionId: string, cycle: Cycle): StoredIssue[] =>
      db.transaction(() => commitCycle(db, sessionId, cycle))(),
  };
}

export type AnalysisStore = ReturnType<typeof createAnalysisStore>;

type Cycle = {
  requirements: BusinessRequirement[];
  issues: StoredIssue[];
  cursor: number;
  at: string;
};

function readQueries(db: Database) {
  return {
    requirements(sessionId: string): BusinessRequirement[] {
      return db
        .query<RequirementRow, [string]>(
          `SELECT ${REQUIREMENT_COLUMNS} FROM business_requirements
           WHERE meeting_session_id = ? ORDER BY created_at, id`,
        )
        .all(sessionId)
        .map(toRequirement);
    },

    issues(sessionId: string): StoredIssue[] {
      return db
        .query<IssueRow, [string]>(
          `SELECT ${ISSUE_COLUMNS} FROM candidate_issues
           WHERE meeting_session_id = ? ORDER BY created_at, id`,
        )
        .all(sessionId)
        .map(toIssue);
    },

    /** The last utterance id analysis has read for this meeting (0 before the first cycle). */
    cursor(sessionId: string): { lastUtteranceId: number; analyzedAt: string | null } {
      const row = db
        .query<{ lastUtteranceId: number; analyzedAt: string }, [string]>(
          `SELECT last_utterance_id AS lastUtteranceId, analyzed_at AS analyzedAt
           FROM analysis_cursors WHERE meeting_session_id = ?`,
        )
        .get(sessionId);
      return row ?? { lastUtteranceId: 0, analyzedAt: null };
    },
  };
}

/** The FDE's decisions on an issue. */
function decisionQueries(db: Database) {
  const issue = (sessionId: string, id: string) => {
    const row = db
      .query<IssueRow, [string, string]>(
        `SELECT ${ISSUE_COLUMNS} FROM candidate_issues WHERE meeting_session_id = ? AND id = ?`,
      )
      .get(sessionId, id);
    return row ? toIssue(row) : null;
  };
  return {
    /** Dismisses an issue; only evidence after `latestUtteranceId` may bring it back. */
    dismiss(
      sessionId: string,
      id: string,
      { latestUtteranceId, at }: { latestUtteranceId: number; at: string },
    ): StoredIssue | null {
      db.run(
        `UPDATE candidate_issues SET status = 'dismissed', dismissed_at_utterance_id = ?, updated_at = ?
         WHERE meeting_session_id = ? AND id = ? AND status != 'resolved'`,
        [latestUtteranceId, at, sessionId, id],
      );
      return issue(sessionId, id);
    },

    /** Saves the issue's suggested question for the FDE (idempotent). */
    save(sessionId: string, id: string, at: string): StoredIssue | null {
      db.run(
        `UPDATE candidate_issues SET saved_at = COALESCE(saved_at, ?), updated_at = ?
         WHERE meeting_session_id = ? AND id = ?`,
        [at, at, sessionId, id],
      );
      return issue(sessionId, id);
    },
  };
}

/**
 * The FDE may dismiss an issue while a cycle is running, after the cycle
 * read it. Re-checked here, inside the write: a dismissal stands unless the
 * cycle cites evidence newer than it.
 */
function overridesDismissal(db: Database, issue: StoredIssue): boolean {
  const current = db
    .query<{ status: string; watermark: number | null }, [string]>(
      "SELECT status, dismissed_at_utterance_id AS watermark FROM candidate_issues WHERE id = ?",
    )
    .get(issue.id);
  if (current?.status !== "dismissed" || issue.status === "dismissed") return false;
  const cited = [...issue.evidenceUtteranceIds, ...issue.resolutionUtteranceIds];
  return !cited.some((id) => id > (current.watermark ?? 0));
}

function commitCycle(db: Database, sessionId: string, cycle: Cycle): StoredIssue[] {
  for (const r of cycle.requirements) {
    db.run(
      `INSERT INTO business_requirements (id, meeting_session_id, description, status,
         evidence_utterance_ids, confirmation_utterance_ids, superseded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET description = excluded.description, status = excluded.status,
         evidence_utterance_ids = excluded.evidence_utterance_ids,
         confirmation_utterance_ids = excluded.confirmation_utterance_ids,
         superseded_by = excluded.superseded_by, updated_at = excluded.updated_at`,
      [
        r.id,
        sessionId,
        r.description,
        r.status,
        JSON.stringify(r.evidenceUtteranceIds),
        JSON.stringify(r.confirmationUtteranceIds),
        r.supersededBy,
        r.createdAt,
        r.updatedAt,
      ],
    );
  }
  const written = cycle.issues.filter((issue) => !overridesDismissal(db, issue));
  for (const i of written) {
    // Saving and the dismissal watermark are the FDE's: a cycle never writes them.
    db.run(
      `INSERT INTO candidate_issues (id, meeting_session_id, type, summary, implementation_impact,
         suggested_question, suggested_owner, evidence_utterance_ids, resolution_utterance_ids,
         priority, status, dismissed_at_utterance_id, saved_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET type = excluded.type, summary = excluded.summary,
         implementation_impact = excluded.implementation_impact,
         suggested_question = excluded.suggested_question, suggested_owner = excluded.suggested_owner,
         evidence_utterance_ids = excluded.evidence_utterance_ids,
         resolution_utterance_ids = excluded.resolution_utterance_ids, priority = excluded.priority,
         status = excluded.status, updated_at = excluded.updated_at`,
      [
        i.id,
        sessionId,
        i.type,
        i.summary,
        i.implementationImpact,
        i.suggestedQuestion,
        i.suggestedOwner,
        JSON.stringify(i.evidenceUtteranceIds),
        JSON.stringify(i.resolutionUtteranceIds),
        i.priority,
        i.status,
        i.dismissedAtUtteranceId,
        i.savedAt,
        i.createdAt,
        i.updatedAt,
      ],
    );
  }
  db.run(
    `INSERT INTO analysis_cursors (meeting_session_id, last_utterance_id, analyzed_at) VALUES (?, ?, ?)
     ON CONFLICT (meeting_session_id) DO UPDATE SET
       last_utterance_id = MAX(last_utterance_id, excluded.last_utterance_id),
       analyzed_at = excluded.analyzed_at`,
    [sessionId, cycle.cursor, cycle.at],
  );
  return written;
}
