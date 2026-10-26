/**
 * Stackra file contract:
 * Purpose: `isRawBody(value)`, the test a transport runs on a query's output before it writes the JSON envelope.
 * Boundary: pure. The transport (gen's HTTP target, the edge) owns the headers; this only reads the mark `rawBody` set.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1; Note STA-1248: raw-body query responses).
 */
import type { RawBody } from "#core/types/raw-body.type";

/**
 * Whether `value` is a `RawBody` a transport must send as is.
 *
 * @example
 * if (isRawBody(output)) return new Response(output.body, { headers: { "content-type": output.contentType } });
 */
export function isRawBody(value: unknown): value is RawBody {
  return typeof value === "object" && value !== null && (value as RawBody)["~raw"] === true;
}
