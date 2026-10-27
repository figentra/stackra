/**
 * Stackra file contract:
 * Purpose: the live state of one table on a `LiveTableMap`: its status word and tone, the lines shown under it
 *          (elapsed time, waiter, party size, spend), and whether it is suggested for the next party.
 * Boundary: types only. The statuses, their words and their tones are the caller's data (a pack or a setting), and
 *           the lines arrive formatted; the map never decides a status. Updating live is the caller's (realtime).
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { Tone } from "@stackra/ui/contracts";

/** The live state of a table. */
export interface LiveTable {
  /** The id of the table's `FloorItem`. */
  readonly id: string;
  /** Its status as words (`Seated`, `Bill printed`). */
  readonly statusLabel: string;
  /** The tone its status is drawn in. */
  readonly tone: Tone;
  /** Formatted lines shown under the table (`42 min`, `Sara`, `4 guests`). */
  readonly lines?: readonly string[] | undefined;
  /** Whether the table is suggested, for example for the next party at the host stand. */
  readonly isSuggested?: boolean | undefined;
}
