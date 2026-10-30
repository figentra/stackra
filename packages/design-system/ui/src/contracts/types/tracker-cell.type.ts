/**
 * Stackra file contract:
 * Purpose: `TrackerCell`, one period of a `TrackerStrip`: a day or an hour, its state and an optional note.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TrackerStatus } from "#contracts/enums/tracker-status.enum";

/** One tracked period. */
export interface TrackerCell {
  /** A stable key, such as the ISO day. */
  readonly key: string;
  /** The period as people read it, such as "28 Oct" or "14:00". */
  readonly label: string;
  /** Its state; it sets the cell's colour. */
  readonly status: TrackerStatus;
  /** What happened, such as "Checkout errors for 12 minutes"; read after the state. */
  readonly note?: string | undefined;
}
