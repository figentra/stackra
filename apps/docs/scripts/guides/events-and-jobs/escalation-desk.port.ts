/**
 * Stackra file contract:
 * Purpose: `EscalationDesk`, the example port of the "Events and background jobs" guide: the on-call team's tool,
 *          which takes a page (quick) and a full escalation report (slow, and down at times).
 * Boundary: the port only; a host binds the driver for its tool (PagerDuty, Opsgenie, an internal API), and the
 *           guide's tests bind a memory one. Ids only cross it.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (ports and drivers); STA-2852.
 */
import { Port } from "@stackra/contracts";

/** Where escalations go. */
export abstract class EscalationDesk extends Port {
  /** Pages whoever is on call about `ticketId`. */
  abstract page(ticketId: string, reason: string): Promise<void>;

  /** Files the full report of `ticketId`; rejects while the tool is unavailable. */
  abstract report(ticketId: string): Promise<void>;
}
