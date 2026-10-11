import type { LiveEvent, LiveFeed } from "../live-feed";

// Proxies and Bun close idle connections; a comment line keeps the channel
// open between utterances.
const HEARTBEAT_MS = 5_000;

/** Response headers for a `meetingEventStream` body. */
export const EVENT_STREAM_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  // Proxies (nginx and friends) must not buffer the stream.
  "x-accel-buffering": "no",
};

type EventStreamSource = {
  sessionId: string;
  feed: Pick<LiveFeed, "subscribe">;
  /** Persisted state at the moment of reading, in the order it should replay. */
  snapshot: () => LiveEvent[];
};

/**
 * A Server-Sent Events body for one meeting: everything persisted so far,
 * then every change as it happens, until the client goes away.
 */
export function meetingEventStream(source: EventStreamSource, signal: AbortSignal) {
  const encoder = new TextEncoder();
  let stop = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop();
        }
      };
      const emit = (event: LiveEvent) => {
        send(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      };
      // Subscribe before reading the snapshot: an event published in
      // between is sent twice (clients merge by id), never lost.
      const unsubscribe = source.feed.subscribe(source.sessionId, emit);
      send("retry: 2000\n\n");
      for (const event of source.snapshot()) emit(event);
      const heartbeat = setInterval(() => send(": keep-alive\n\n"), HEARTBEAT_MS);
      stop = () => {
        stop = () => {};
        clearInterval(heartbeat);
        unsubscribe();
        signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // Already closed by the client.
        }
      };
      const onAbort = () => stop();
      signal.addEventListener("abort", onAbort);
    },
    cancel() {
      stop();
    },
  });
}
