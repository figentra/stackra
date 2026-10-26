/**
 * Stackra file contract:
 * Purpose: `IdleTimer`, a running idle countdown as `idleTimer` returns it: `touch` restarts it, `stop` ends it.
 * Boundary: internal type of the kiosk surfaces.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 1).
 */

/** A running idle countdown. */
export interface IdleTimer {
  /** Restarts the countdown. */
  readonly touch: () => void;
  /** Ends the countdown. */
  readonly stop: () => void;
}
