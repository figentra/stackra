/**
 * Stackra file contract:
 * Purpose: `CommittingCall`, the running call whose transaction committed recorded events: its actor, its id and the
 *          scope it ran in, which `commitEvents` writes beside each integration event (STA-1789).
 * Boundary: a type only; the fields of an action call's context the testing unit of work reads, so this package never
 *           depends on `@stackra/actions`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0141 (decision 3: the meta travels with the event).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

/** The call that committed. */
export interface CommittingCall {
  /** Who made the call. */
  readonly actor?: Actor;

  /** The call's id, the events' correlation id. */
  readonly callId?: string;

  /** The scope the call ran in. */
  readonly scope?: ScopeRef;
}
