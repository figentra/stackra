/**
 * Stackra file contract:
 * Purpose: `Approver`, the person granting a parked approval as `approverRefusal` checks them: who they are, the seat
 *          kind they hold, and whether their session stepped up.
 * Boundary: a type only. The seat kind comes from entitlements and the step-up from identity, read by the gate's
 *           driver; never from request input.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02; J2-6; ADR 0360.
 */
import type { Actor } from "@stackra/contracts";

/** One approver at the moment of granting. */
export interface Approver {
  /** The verified approver. */
  readonly actor: Actor;

  /** The seat kind the approver holds, when they hold a seat. */
  readonly seatKind?: string;

  /** Whether the approver's session stepped up for this grant. */
  readonly steppedUp: boolean;
}
