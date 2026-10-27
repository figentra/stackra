/**
 * Stackra file contract:
 * Purpose: the props of the `KdsBoard`: the tickets, the clock they age against, the age colours, the all-day
 *          counts strip, and the handlers a bump, an item bump or a recall reports to.
 * Boundary: types only. The board proposes; the caller bumps, recalls and saves. `now` is the caller's clock, so the
 *           board holds no timer; a station board and the expo screen are the same board over different tickets.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { KdsAgeTone } from "#contracts/types/kds-age-tone.type";
import type { KdsTicket } from "#contracts/types/kds-ticket.type";

/** Props of the `KdsBoard`. */
export interface KdsBoardContractProps {
  /** The board's name for screen readers (`Grill`, `Expo`). */
  readonly label: string;
  /** The tickets, oldest first. */
  readonly tickets: readonly KdsTicket[];
  /** The current time in epoch milliseconds; the caller ticks it. */
  readonly now: number;
  /** The age colours, a setting. A ticket younger than every step is drawn in the default tone. */
  readonly ageTones: readonly KdsAgeTone[];
  /** Formats a ticket's age in whole minutes (`7 min`). */
  readonly formatAge: (minutes: number) => string;
  /** Whether to show the all-day counts of the lines still to make. */
  readonly showAllDay?: boolean | undefined;
  /** Called with the id of the ticket bumped. */
  readonly onBump?: ((ticketId: string) => void) | undefined;
  /** Called with the ids of the ticket and the line bumped or un-bumped. */
  readonly onItemBump?: ((ticketId: string, itemId: string) => void) | undefined;
  /** Called to recall the last bumped ticket. */
  readonly onRecall?: (() => void) | undefined;
}
