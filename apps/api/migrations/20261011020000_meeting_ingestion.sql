-- One notetaker session per Start Shadowing. `status`, `ended_at` and
-- `error_message` are derived from the provider reports below (or from a
-- refused bot request) and cached here for reads.
CREATE TABLE meeting_sessions (
  id TEXT NOT NULL PRIMARY KEY,
  meeting_url TEXT NOT NULL,
  provider_bot_id TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('requested', 'joining', 'waiting_room', 'needs_help', 'recording', 'ended', 'failed')
  ),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  error_message TEXT
) STRICT;

CREATE INDEX meeting_sessions_by_meeting ON meeting_sessions (meeting_url, started_at);

-- Every lifecycle report the provider sent, whichever path it came by
-- (live stream, catch-up read, webhook). The session status is a function
-- of the whole set, so delivery order cannot change the outcome.
CREATE TABLE meeting_status_reports (
  meeting_session_id TEXT NOT NULL REFERENCES meeting_sessions (id),
  status TEXT NOT NULL,
  reason TEXT,
  at TEXT NOT NULL,
  UNIQUE (meeting_session_id, status, at)
) STRICT;

-- Finalized utterances only. `dedup_key` is the provider's segment id, so
-- a segment delivered again (a reconnect, a catch-up read) adds no row.
CREATE TABLE transcript_utterances (
  id INTEGER NOT NULL PRIMARY KEY,
  meeting_session_id TEXT NOT NULL REFERENCES meeting_sessions (id),
  dedup_key TEXT NOT NULL,
  speaker_id TEXT,
  speaker_name TEXT,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  received_at TEXT NOT NULL,
  UNIQUE (meeting_session_id, dedup_key)
) STRICT;

CREATE INDEX transcript_utterances_in_order
  ON transcript_utterances (meeting_session_id, start_time);

-- Verified provider webhook deliveries, written before the webhook is
-- acknowledged and processed after it. `id` is the provider's event id; the
-- payload is cleared once processed and kept, with the error, if not.
CREATE TABLE provider_deliveries (
  id TEXT NOT NULL PRIMARY KEY,
  received_at TEXT NOT NULL,
  payload TEXT,
  processed_at TEXT,
  error TEXT
) STRICT;

CREATE INDEX provider_deliveries_pending ON provider_deliveries (id) WHERE processed_at IS NULL;
