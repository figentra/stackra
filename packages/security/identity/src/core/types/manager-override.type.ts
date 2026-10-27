/**
 * Stackra file contract:
 * Purpose: `ManagerOverride`, a manager's approval of one action above the cashier's limits on a shared device: who
 *          approved, for which permission, when, and until when the approval may be used.
 * Boundary: a type only; the till passes it with the action, the audit records it. It is short-lived by configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8: manager override above limits); owner round 3 #15.
 */
import type { PublicId } from "@stackra/contracts";

/** A manager's approval of one action above the cashier's limits on a shared device. */
export interface ManagerOverride {
  /** The shared device. */
  readonly device: PublicId;

  /** The manager who approved. */
  readonly manager: PublicId;

  /** The permission key approved (`sales.sale.refund`). */
  readonly permission: string;

  /** When it was approved. */
  readonly at: Date;

  /** When it stops being usable. */
  readonly expiresAt: Date;
}
