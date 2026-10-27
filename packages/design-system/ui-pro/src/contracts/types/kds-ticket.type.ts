/**
 * Stackra file contract:
 * Purpose: one kitchen ticket on a `KdsBoard`: its title and subtitle, when it was sent, its lines, and whether it is
 *          a rush, held or carries an allergy.
 * Boundary: types only; the caller's prep ticket. The board ages a ticket from `sentAt` against the caller's `now`.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { KdsTicketItem } from "#contracts/types/kds-ticket-item.type";

/** One kitchen ticket. */
export interface KdsTicket {
  /** The ticket's id. */
  readonly id: string;
  /** Its heading (`Table 12`, `#1043`). */
  readonly title: string;
  /** A formatted second line (the waiter, the channel, the station). */
  readonly subtitle?: string | undefined;
  /** When it was sent to the kitchen, in epoch milliseconds. */
  readonly sentAt: number;
  /** The ticket's lines. */
  readonly items: readonly KdsTicketItem[];
  /** Whether it is a rush. */
  readonly isRush?: boolean | undefined;
  /** Whether the whole ticket is held. */
  readonly isHeld?: boolean | undefined;
  /** Whether any line carries an allergy. */
  readonly hasAllergy?: boolean | undefined;
}
