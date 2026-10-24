/**
 * Stackra file contract:
 * Purpose: `isoDateTime()`, the codec generated code writes for a field typed `Date`: ISO 8601 with an offset on the
 *          wire, a `Date` in code. `parse` decodes; `z.encode` encodes back to ISO 8601 in UTC.
 * Boundary: a time without an offset is refused, because its instant is ambiguous. A `Date` given to `parse` passes
 *           too (code-form values given to `X.create`), and an invalid `Date` fails. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a `Date` field compiles to a codec, ISO 8601 with an offset on the wire).
 */
import { z } from "zod";

/**
 * A new codec between an ISO 8601 date-time with an offset and a `Date`.
 *
 * @example
 * export const OrderView$ = z.object({ placedAt: isoDateTime(), paidAt: isoDateTime().nullable() });
 * OrderView$.parse({ placedAt: "2026-10-24T10:00:00+03:00", paidAt: null }).placedAt; // Date 07:00Z
 * z.encode(isoDateTime(), new Date(0)); // "1970-01-01T00:00:00.000Z"
 */
export function isoDateTime() {
  return z.codec(z.union([z.iso.datetime({ offset: true }), z.date()]), z.date(), {
    decode: (wire) => (wire instanceof Date ? wire : new Date(wire)),
    encode: (date) => date.toISOString(),
  });
}
