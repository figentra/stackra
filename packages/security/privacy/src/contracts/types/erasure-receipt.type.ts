/**
 * Stackra file contract:
 * Purpose: `ErasureReceipt`, the proof an erasure ran: what was disposed of per model, what a legal hold kept, and
 *          whether the subject key was crypto-shredded. It is the erasure saga's output and the payload of
 *          `SubjectErased`.
 * Boundary: a type only; counts and kinds, never row ids or contents. `kept` uses the workflow's `KeptRecords`, the
 *           same shape a `ServiceAcked` erasure ack carries, so a cross-service erasure joins the receipts as is.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decisions 2 and 4); ADR 0134 (legal holds); ADR 0212 (crypto-shredding); STA-1312;
 *                     STA-1375.
 */
import type { KeptRecords } from "@stackra/workflow";

import type { ErasedRecords } from "#contracts/types/erased-records.type";

/** One erasure's receipt. */
export interface ErasureReceipt {
  /** The erasure request's id, as the caller gave it. */
  readonly erasureId: string;

  /** The erased subject's public id. */
  readonly subject: string;

  /** What was disposed of, per model; a model with no rows is absent. */
  readonly erased: readonly ErasedRecords[];

  /** What a legal hold kept, per model. */
  readonly kept: readonly KeptRecords[];

  /** True when the subject key's salt was destroyed; false when a hold keeps shredded fields readable or none existed. */
  readonly shredded: boolean;

  /** When the erasure finished, ISO 8601. */
  readonly at: string;
}
