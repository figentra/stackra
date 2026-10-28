/**
 * Stackra file contract:
 * Purpose: `StaleVersionError`, the refusal of a write to a `Versioned` record someone else changed since the caller
 *          read it: the version the caller expected (`expectedVersion`, If-Match) or the one its unit of work loaded is
 *          no longer the row's.
 * Boundary: a refusal (`conflict`, 409), not retryable as is: the caller reads the record again and decides. `model`
 *           is the entity name; the record's id travels only when the write named it.
 * Runtime: node
 * Governing contract: ADR 0133 (decision 6: optimistic concurrency, 409 `conflict`); ADR 0140 (refusals); ADR 0328
 *                     (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The record changed since the caller read it. */
export class StaleVersionError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The entity name of the record. */
  model!: string;
}
