/**
 * Stackra file contract:
 * Purpose: `ServerSentEvent`, one event of a `text/event-stream` body as `readServerSentEvents` yields it.
 * Boundary: a type only; the fields of the WHATWG event-stream format, `data` still text (the caller parses it).
 * Runtime: isomorphic
 * Governing contract: the WHATWG HTML event-stream interpretation rules.
 */

/** One dispatched event. */
export interface ServerSentEvent {
  /** The `event:` field; `message` when the event names none. */
  readonly event: string;

  /** The `data:` lines joined with `\n`. */
  readonly data: string;

  /** The last event id seen on the stream so far (`""` when none), for `Last-Event-ID` on reconnect. */
  readonly id: string;

  /** The reconnection time in milliseconds the stream last set with `retry:`, when it set one. */
  readonly retry?: number;
}
