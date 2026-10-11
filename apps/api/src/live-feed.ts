/** One change for a meeting's live channel: an SSE event name and its JSON payload. */
export type LiveEvent = { type: string; data: unknown };

type Listener = (event: LiveEvent) => void;

/**
 * In-process fan-out from the features that change a meeting (ingestion,
 * analysis) to its open live channels, keyed by meeting session. It holds
 * no history: a channel reads persisted state when it opens and only needs
 * what happens after.
 */
export function createLiveFeed() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    publish(sessionId: string, event: LiveEvent): void {
      for (const listener of listeners.get(sessionId) ?? []) listener(event);
    },
    subscribe(sessionId: string, listener: Listener): () => void {
      const set = listeners.get(sessionId) ?? new Set();
      set.add(listener);
      listeners.set(sessionId, set);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(sessionId);
      };
    },
  };
}

export type LiveFeed = ReturnType<typeof createLiveFeed>;
