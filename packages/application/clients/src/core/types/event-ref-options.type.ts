/**
 * Stackra file contract:
 * Purpose: `EventRefOptions<S>`, the second argument of `eventRef`: the payload schema and the producer's broadcast
 *          channel and audience.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (wire names); ADR 0225 (broadcast).
 */
import type { ZodType } from "zod";

/** What an event ref declares. */
export interface EventRefOptions<S extends ZodType> {
  /** The payload schema. */
  readonly payload: S;

  /** The broadcast channel pattern, with `{field}` placeholders from the payload. */
  readonly channel?: string;

  /** Who receives the broadcast (`principal`). */
  readonly audience?: string;
}
