/**
 * Stackra file contract:
 * Purpose: one line of a kitchen ticket: its quantity and name, its notes (modifiers, seat), and whether it is done,
 *          held or carries an allergy.
 * Boundary: types only; the caller's prep-ticket lines, already translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** One line of a kitchen ticket. */
export interface KdsTicketItem {
  /** The line's id. */
  readonly id: string;
  /** How many of the item the ticket holds. */
  readonly quantity: number;
  /** The item's name, as the kitchen calls it. */
  readonly name: string;
  /** Modifiers, seat and notes, one per line. */
  readonly notes?: readonly string[] | undefined;
  /** Whether the line is bumped (done). */
  readonly isDone?: boolean | undefined;
  /** Whether the line is held (a later course). */
  readonly isHeld?: boolean | undefined;
  /** Whether the line carries an allergy. */
  readonly hasAllergy?: boolean | undefined;
}
