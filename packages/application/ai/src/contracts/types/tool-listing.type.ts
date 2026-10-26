/**
 * Stackra file contract:
 * Purpose: `ToolListing`, who asks the `ToolDispatcher` for an agent's tools: the acting principal, the scope node and
 *          the record, which the permission matrix and IAM filter by.
 * Boundary: a type only; the run fills it from its own stored facts, never from the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 4: an agent never has access its human lacks); R3-SO-02.
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { RecordScope } from "#contracts/types/record-scope.type";

/** The listing context of one run. */
export interface ToolListing {
  /** The acting agent principal, with the human in `onBehalfOf`. */
  readonly actor: Actor;

  /** The scope node the run acts in. */
  readonly scope?: ScopeRef;

  /** The record the run works in. */
  readonly record?: RecordScope;
}
