/**
 * Stackra file contract:
 * Purpose: `ActivityProgress`, what a Live Activity shows for one order or booking in progress: the product's own
 *          reference, the translated title and status, and how many of its steps are done.
 * Boundary: a type only; plain serialisable data, because the activity renders in the widget extension, not in the
 *           app. The product translates every string before it calls the port.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (decision 9); STA-1539.
 */

/** One order or booking in progress, as its Live Activity shows it. */
export interface ActivityProgress {
  /** The product's id of the order or booking; one activity per reference. */
  readonly reference: string;

  /** The translated headline (`Order 1042`, `Table for 4 at 20:00`). */
  readonly title: string;

  /** The translated status line (`Being prepared`, `Driver 5 min away`). */
  readonly status: string;

  /** How many steps are done, from 0 to `steps`. */
  readonly step: number;

  /** How many steps the order or booking has. */
  readonly steps: number;

  /** The deep link a tap on the activity opens; read when the activity starts only. */
  readonly url?: string;
}
