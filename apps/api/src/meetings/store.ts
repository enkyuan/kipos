import type { Database } from "bun:sqlite";
import type { MeetingSession, TranscriptUtterance } from "./contract";
import { canonicalMeetUrl } from "./meeting-url";
import { deriveStatus, type DerivedStatus } from "./status";
import type { NewUtterance, StatusReport, WebhookTarget } from "./vexa-events";

const SESSION_COLUMNS = `id, meeting_url AS meetingUrl, provider_bot_id AS providerBotId, status,
  started_at AS startedAt, ended_at AS endedAt, error_message AS errorMessage`;

const UTTERANCE_COLUMNS = `id, meeting_session_id AS meetingSessionId, speaker_id AS speakerId,
  speaker_name AS speakerName, text, start_time AS startTime, end_time AS endTime,
  received_at AS receivedAt`;

// A live session stops holding its meeting when it has gone quiet: no word
// at all two minutes after a start (the bot request or the process died),
// or no activity for six hours (a lost end-of-meeting report).
const SILENT_START_MS = 2 * 60_000;
const IDLE_MS = 6 * 60 * 60_000;

/** Meeting sessions, their status reports and transcripts in SQLite. */
export function createMeetingStore(db: Database) {
  return { ...sessionQueries(db), ...statusQueries(db), ...transcriptQueries(db) };
}

function finder(db: Database) {
  const find = (id: string) =>
    db
      .query<MeetingSession, [string]>(
        `SELECT ${SESSION_COLUMNS} FROM meeting_sessions WHERE id = ?`,
      )
      .get(id);
  const mustFind = (id: string) => {
    const session = find(id);
    if (!session) throw new Error(`meeting session ${id} vanished`);
    return session;
  };
  return { find, mustFind };
}

function isStale(session: MeetingSession & { lastActivity: string }, now: number): boolean {
  const quietFor = now - Date.parse(session.lastActivity);
  const neverHeard = session.status === "requested" && session.lastActivity === session.startedAt;
  return quietFor > (neverHeard ? SILENT_START_MS : IDLE_MS);
}

function sessionQueries(db: Database) {
  const { find, mustFind } = finder(db);
  const latestLive = db.query<MeetingSession & { lastActivity: string }, [string]>(
    `SELECT ${SESSION_COLUMNS}, MAX(started_at,
       COALESCE((SELECT MAX(at) FROM meeting_status_reports WHERE meeting_session_id = s.id), ''),
       COALESCE((SELECT MAX(received_at) FROM transcript_utterances WHERE meeting_session_id = s.id), '')
     ) AS lastActivity
     FROM meeting_sessions s
     WHERE meeting_url = ? AND status NOT IN ('ended', 'failed')
     ORDER BY started_at DESC LIMIT 1`,
  );
  const fail = (id: string, message: string, at: string) => {
    db.run(
      `UPDATE meeting_sessions SET status = 'failed', error_message = ?, ended_at = ? WHERE id = ?`,
      [message, at, id],
    );
    return mustFind(id);
  };

  return {
    find,
    fail,

    /** A new session in `requested`, or the meeting's live one (`created: false`). */
    start(meetingUrl: string, at: string): { session: MeetingSession; created: boolean } {
      return db.transaction(() => {
        const live = latestLive.get(meetingUrl);
        if (live && !isStale(live, Date.parse(at))) {
          const { lastActivity: _, ...session } = live;
          return { session, created: false };
        }
        if (live)
          fail(live.id, "The notetaker stopped reporting, so this session was replaced.", at);
        const id = crypto.randomUUID();
        db.run(
          `INSERT INTO meeting_sessions (id, meeting_url, status, started_at) VALUES (?, ?, 'requested', ?)`,
          [id, meetingUrl, at],
        );
        return { session: mustFind(id), created: true };
      })();
    },

    attachBot(id: string, providerBotId: string): MeetingSession {
      db.run("UPDATE meeting_sessions SET provider_bot_id = ? WHERE id = ?", [providerBotId, id]);
      return mustFind(id);
    },

    /** Keeps the session `requested`, with a note on why the bot is unconfirmed. */
    noteUnconfirmed(id: string, message: string): MeetingSession {
      db.run(
        `UPDATE meeting_sessions SET error_message = ? WHERE id = ? AND status = 'requested'`,
        [message, id],
      );
      return mustFind(id);
    },

    /** Sessions still waiting on the provider: watched again after a restart. */
    liveSessions(): { id: string; meetingUrl: string }[] {
      return db
        .query<{ id: string; meetingUrl: string }, []>(
          `SELECT id, meeting_url AS meetingUrl FROM meeting_sessions
           WHERE status NOT IN ('ended', 'failed')`,
        )
        .all();
    },

    /**
     * The session a webhook is about: by provider record id when it names
     * one (and nothing else), else the meeting's latest session.
     */
    findForProvider({ providerMeetingId, code }: WebhookTarget): { id: string } | null {
      if (providerMeetingId) {
        return db
          .query<{ id: string }, [string]>(
            "SELECT id FROM meeting_sessions WHERE provider_bot_id = ?",
          )
          .get(providerMeetingId);
      }
      const meetingUrl = code ? canonicalMeetUrl(code) : null;
      return db
        .query<{ id: string }, [string | null]>(
          "SELECT id FROM meeting_sessions WHERE meeting_url = ? ORDER BY started_at DESC LIMIT 1",
        )
        .get(meetingUrl);
    },
  };
}

function statusQueries(db: Database) {
  const { find, mustFind } = finder(db);
  const reports = db.query<StatusReport, [string]>(
    "SELECT status, reason, at FROM meeting_status_reports WHERE meeting_session_id = ?",
  );
  const same = (a: MeetingSession, b: DerivedStatus) =>
    a.status === b.status && a.endedAt === b.endedAt && a.errorMessage === b.errorMessage;

  return {
    /**
     * Records a provider status report and re-derives the session status
     * from all of them. Returns the session when what a person sees changed.
     */
    recordStatus(id: string, report: StatusReport): MeetingSession | null {
      db.run(
        `INSERT INTO meeting_status_reports (meeting_session_id, status, reason, at) VALUES (?, ?, ?, ?)
         ON CONFLICT (meeting_session_id, status, at) DO UPDATE SET reason = COALESCE(excluded.reason, reason)`,
        [id, report.status, report.reason, report.at],
      );
      const all = reports.all(id);
      const current = find(id);
      // A session failed here (Vexa refused it, or it was replaced) has no
      // failed report; it stays failed whatever its bot reports afterwards.
      const failedLocally = current?.status === "failed" && !all.some((r) => r.status === "failed");
      const derived = deriveStatus(all);
      if (!derived || !current || failedLocally || same(current, derived)) return null;
      db.run(
        `UPDATE meeting_sessions SET status = ?, ended_at = ?, error_message = ? WHERE id = ?`,
        [derived.status, derived.endedAt, derived.errorMessage, id],
      );
      return mustFind(id);
    },
  };
}

function transcriptQueries(db: Database) {
  const byId = db.query<TranscriptUtterance, [number]>(
    `SELECT ${UTTERANCE_COLUMNS} FROM transcript_utterances WHERE id = ?`,
  );
  return {
    /** Stores a finalized utterance; null if this segment is already stored. */
    recordUtterance(
      sessionId: string,
      utterance: NewUtterance,
      receivedAt: string,
    ): TranscriptUtterance | null {
      const inserted = db
        .query<
          { id: number },
          [string, string, string | null, string | null, string, number, number, string]
        >(
          `INSERT INTO transcript_utterances
             (meeting_session_id, dedup_key, speaker_id, speaker_name, text, start_time, end_time, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (meeting_session_id, dedup_key) DO NOTHING
           RETURNING id`,
        )
        .get(
          sessionId,
          utterance.dedupKey,
          utterance.speakerId,
          utterance.speakerName,
          utterance.text,
          utterance.startTime,
          utterance.endTime,
          receivedAt,
        );
      return inserted ? byId.get(inserted.id) : null;
    },

    /** Utterances stored after `afterId`, in arrival order (analysis reads past its cursor). */
    utterancesAfter(sessionId: string, afterId: number, limit: number): TranscriptUtterance[] {
      return db
        .query<TranscriptUtterance, [string, number, number]>(
          `SELECT ${UTTERANCE_COLUMNS} FROM transcript_utterances
           WHERE meeting_session_id = ? AND id > ? ORDER BY id LIMIT ?`,
        )
        .all(sessionId, afterId, limit);
    },

    /** The `limit` utterances stored just before `beforeId`, oldest first. */
    utterancesBefore(sessionId: string, beforeId: number, limit: number): TranscriptUtterance[] {
      return db
        .query<TranscriptUtterance, [string, number, number]>(
          `SELECT * FROM (SELECT ${UTTERANCE_COLUMNS} FROM transcript_utterances
             WHERE meeting_session_id = ? AND id < ? ORDER BY id DESC LIMIT ?) ORDER BY id`,
        )
        .all(sessionId, beforeId, limit);
    },

    utteranceIds(sessionId: string): Set<number> {
      const rows = db
        .query<{ id: number }, [string]>(
          "SELECT id FROM transcript_utterances WHERE meeting_session_id = ?",
        )
        .all(sessionId);
      return new Set(rows.map((row) => row.id));
    },

    latestUtteranceId(sessionId: string): number {
      return (
        db
          .query<{ id: number | null }, [string]>(
            "SELECT MAX(id) AS id FROM transcript_utterances WHERE meeting_session_id = ?",
          )
          .get(sessionId)?.id ?? 0
      );
    },

    /** The transcript in spoken order, whatever order it arrived in. */
    transcript(sessionId: string): TranscriptUtterance[] {
      return db
        .query<TranscriptUtterance, [string]>(
          `SELECT ${UTTERANCE_COLUMNS} FROM transcript_utterances
           WHERE meeting_session_id = ? ORDER BY start_time, id`,
        )
        .all(sessionId);
    },
  };
}

/**
 * Verified provider webhook deliveries, kept until processed so a crash
 * between the acknowledgement and the processing loses nothing.
 */
export function createDeliveryInbox(db: Database) {
  return {
    /** Records a delivery; false if this event id was already received. */
    accept(id: string, payload: string, receivedAt: string): boolean {
      return (
        db.run(
          `INSERT INTO provider_deliveries (id, received_at, payload) VALUES (?, ?, ?)
           ON CONFLICT (id) DO NOTHING`,
          [id, receivedAt, payload],
        ).changes > 0
      );
    },
    /** Unprocessed deliveries, oldest first; with `retryFailed`, failed ones too. */
    pending(retryFailed = false): { id: string; payload: string }[] {
      return db
        .query<{ id: string; payload: string }, [number]>(
          `SELECT id, payload FROM provider_deliveries
           WHERE processed_at IS NULL OR (?1 AND error IS NOT NULL AND payload IS NOT NULL)
           ORDER BY rowid`,
        )
        .all(retryFailed ? 1 : 0);
    },
    /** Marks a delivery processed. Its payload is kept only if processing failed. */
    settle(id: string, error: string | null, at: string): void {
      db.run(
        `UPDATE provider_deliveries
         SET processed_at = ?, error = ?, payload = CASE WHEN ? IS NULL THEN NULL ELSE payload END
         WHERE id = ?`,
        [at, error, error, id],
      );
    },
  };
}
