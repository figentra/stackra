/**
 * Stackra file contract:
 * Purpose: `ImportChange`, what a target's `upsert` returns per record so the run can be reverted: the record's key and
 *          its before-image.
 * Boundary: a type only. `before` is the target's own serialised record, opaque to this package; `null` means the
 *           upsert created the record, so a revert deletes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 and 8).
 */
import type { Json } from "@stackra/contracts";

/** One record an import batch wrote. */
export interface ImportChange {
  /** The record's import key (the key the upsert matched on). */
  readonly key: string;

  /** The record before the batch, or `null` when the batch created it. */
  readonly before: Json | null;
}
