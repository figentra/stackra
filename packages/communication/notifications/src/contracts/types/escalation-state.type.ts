/**
 * Stackra file contract:
 * Purpose: `EscalationState`, where one notification that needs acknowledging stands: when it was first sent, when (if)
 *          someone acknowledged it, and how many escalation steps already ran.
 * Boundary: a type only; the notifications service stores it beside the delivery.
 * Runtime: isomorphic
 * Governing contract: row "acknowledgement and escalation" of the package needs (2026-10-25); OS-199.
 */

/** An acknowledgement's state. */
export interface EscalationState {
  /** When the notification was first sent. */
  readonly sentAt: Date;

  /** When someone acknowledged it; undefined while nobody has. */
  readonly acknowledgedAt?: Date;

  /** How many steps already ran. */
  readonly escalated: number;
}
