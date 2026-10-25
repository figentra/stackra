/**
 * Stackra file contract:
 * Purpose: `CheckOptions`, what a permission check takes beside the actor and the permission: where the call acts,
 *          the record (when there is one) and the time.
 * Boundary: a type only. Without `scope` the call acts at the root, so only grants held at a root node apply. Without
 *           `record` a conditional deny is not tested (the permission step has no record); `record: null` is a record
 *           step whose model registered no fact source, where a conditional deny that applies denies (fail closed).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 and 3); ADR 0138 (as amended: permission step, then the record in
 *                     `handle`); ADR 0331 (decision 6: the time is the caller's).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { RecordFacts } from "#core/types/record-facts.type";

/** The options of a check. */
export interface CheckOptions {
  /** The scope node the call acts in; absent for a call at the root. */
  readonly scope?: ScopeRef;

  /** The record the call acts on; `null` for a record whose model registered no fact source. */
  readonly record?: RecordFacts | null;

  /** The time grants expire against and conditions read; the bound `Clock` when absent. */
  readonly at?: Date;
}
