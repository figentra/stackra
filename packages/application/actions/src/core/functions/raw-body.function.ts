/**
 * Stackra file contract:
 * Purpose: `rawBody(contentType, body, filename?)`, the output of a query whose response is a raw body, and
 *          `isRawBody(value)`, the test a transport runs on a query's output before it writes the JSON envelope.
 * Boundary: pure. The transport (gen's HTTP target, the edge) owns the headers; this only marks the output.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1; Note STA-1248: raw-body query responses).
 */
import type { RawBody } from "#core/types/raw-body.type";

/**
 * A query output the transport sends as the body itself.
 *
 * @example
 * async handle(input: FeedInput): Promise<RawBody> {
 *   return rawBody("text/calendar; charset=utf-8", icalFeed(await this.bookings.of(input.token)));
 * }
 */
export function rawBody(contentType: string, body: string, filename?: string): RawBody {
  return Object.freeze({
    "~raw": true,
    contentType,
    body,
    ...(filename === undefined ? {} : { filename }),
  });
}

/**
 * Whether `value` is a `RawBody` a transport must send as is.
 *
 * @example
 * if (isRawBody(output)) return new Response(output.body, { headers: { "content-type": output.contentType } });
 */
export function isRawBody(value: unknown): value is RawBody {
  return typeof value === "object" && value !== null && (value as RawBody)["~raw"] === true;
}
