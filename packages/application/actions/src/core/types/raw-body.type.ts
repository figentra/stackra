/**
 * Stackra file contract:
 * Purpose: `RawBody`, a query output the transport sends as the response body itself (an iCalendar feed, a CSV, an
 *          XML sitemap) instead of the JSON envelope.
 * Boundary: a type only; built with `rawBody(...)` and recognised with `isRawBody(...)`. The `~raw` marker is what a
 *           transport tests, so an ordinary output with `contentType` and `body` fields stays JSON. Queries only: an
 *           action's output is always the JSON envelope.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1; Note STA-1248: raw-body query responses).
 */

/** A response body the transport sends as is. */
export interface RawBody {
  /** The marker a transport tests (`isRawBody`). */
  readonly "~raw": true;

  /** The response's media type (`text/calendar; charset=utf-8`). */
  readonly contentType: string;

  /** The response body. */
  readonly body: string;

  /** A download name, sent as `Content-Disposition: attachment`; absent for an inline body. */
  readonly filename?: string;
}
