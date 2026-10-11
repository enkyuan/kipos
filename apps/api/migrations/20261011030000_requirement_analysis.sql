-- Live requirement extraction (docs/decisions/0004-requirement-analysis.md).
-- Evidence columns hold JSON arrays of transcript_utterances ids; every id
-- is checked against the transcript before a row is written.

CREATE TABLE business_requirements (
  id TEXT NOT NULL PRIMARY KEY,
  meeting_session_id TEXT NOT NULL REFERENCES meeting_sessions (id),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'confirmed', 'superseded')),
  evidence_utterance_ids TEXT NOT NULL CHECK (json_valid(evidence_utterance_ids)),
  -- Where a participant explicitly confirmed it; empty unless `confirmed`.
  confirmation_utterance_ids TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(confirmation_utterance_ids)),
  superseded_by TEXT REFERENCES business_requirements (id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX business_requirements_by_meeting ON business_requirements (meeting_session_id);

CREATE TABLE candidate_issues (
  id TEXT NOT NULL PRIMARY KEY,
  meeting_session_id TEXT NOT NULL REFERENCES meeting_sessions (id),
  type TEXT NOT NULL CHECK (type IN (
    'missing_business_rule', 'ambiguous_requirement', 'conflicting_requirement',
    'missing_integration_detail', 'unresolved_ownership', 'external_dependency'
  )),
  summary TEXT NOT NULL,
  implementation_impact TEXT NOT NULL,
  suggested_question TEXT NOT NULL,
  suggested_owner TEXT,
  evidence_utterance_ids TEXT NOT NULL CHECK (json_valid(evidence_utterance_ids)),
  resolution_utterance_ids TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(resolution_utterance_ids)),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('open', 'dismissed', 'resolved')),
  -- The newest utterance id when the FDE dismissed it: only evidence after
  -- this may bring it back.
  dismissed_at_utterance_id INTEGER,
  saved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX candidate_issues_by_meeting ON candidate_issues (meeting_session_id);

-- How far analysis has read each meeting's transcript.
CREATE TABLE analysis_cursors (
  meeting_session_id TEXT NOT NULL PRIMARY KEY REFERENCES meeting_sessions (id),
  last_utterance_id INTEGER NOT NULL,
  analyzed_at TEXT NOT NULL
) STRICT;
