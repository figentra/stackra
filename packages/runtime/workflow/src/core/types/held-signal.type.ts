/**
 * Stackra file contract:
 * Purpose: `HeldSignal`, a sent signal the journal holds until a run of its scope waits on the same signal and
 *          correlation: its key, correlation, payload, scope and when it arrived and lapses.
 * Boundary: a type only; the payload is JSON. A held signal is taken once, by the first run that resumes on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (0294 note: a signal that arrives early is held); ADR 0327 (a scope is a `ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/** One held signal. */
export interface HeldSignal {
  /** The held signal's id. */
  readonly id: PublicId<"wfs">;

  /** The signal's registered key, else its class name. */
  readonly signal: string;

  /** The correlation it was sent with, in canonical form (`""` for none). */
  readonly correlation: string;

  /** Its fields, as JSON. */
  readonly payload: object;

  /** The scope of the call that sent it; absent for a platform call. */
  readonly scope?: ScopeRef;

  /** When it arrived; a wait resumes on it only when it arrived before the wait timed out. */
  readonly receivedAt: Date;

  /** When an untaken signal is dropped. */
  readonly expiresAt: Date;
}
