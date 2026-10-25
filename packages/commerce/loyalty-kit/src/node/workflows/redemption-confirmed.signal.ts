/**
 * Stackra file contract:
 * Purpose: `RedemptionConfirmed`, the signal that tells a parked redemption its host step succeeded, so the debit stays.
 * Boundary: a declaration only; its key is derived (`loyalty_kit.redemption_confirmed`). Sent by
 *           `ConfirmRedemptionAction` and nothing else, so permission, isolation and the audit trail apply to every
 *           confirmation. A waiting run resumes only when the signal's correlation equals the step's `correlate` value
 *           (the member and the reference), so one member never confirms another's redemption. The engine holds a
 *           signal that arrives before the run parks.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 18 and 20); ADR 0152 (decision 1: `waitFor` parks a run until a
 *                     signal).
 */
import { Signal } from "@stackra/workflow";

/**
 * Sent once per confirmed redemption; a repeated send changes nothing.
 *
 * @example
 * await ctx.signal(RedemptionConfirmed, { memberId, reference }, { memberId, reference });
 */
export class RedemptionConfirmed extends Signal {
  /** The member whose points were debited, taken from the confirming actor, never from input. */
  memberId!: string;

  /** The reference the redemption was debited under. */
  reference!: string;
}
