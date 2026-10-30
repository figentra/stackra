/**
 * Stackra file contract:
 * Purpose: `TrackerStripContractProps`, the props of every runtime's `TrackerStrip`: an uptime-style row of equal
 *          cells, one per period, coloured by state, with a summary and the start and end captions.
 * Boundary: types only. The cells run in reading order, oldest first: from the right in Arabic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1,
 *          1.4.1 and 2.1.1; STA-1371.
 */
import type { TrackerCell } from "#contracts/types/tracker-cell.type";

/** Props shared by the web and native `TrackerStrip`. */
export interface TrackerStripContractProps {
  /** The periods, oldest first. */
  readonly cells: readonly TrackerCell[];
  /** The strip's accessible name, such as "API, last 30 days". */
  readonly label: string;
  /** The line at the header's end, such as "99.98% uptime"; worked out from the cells by default. */
  readonly summary?: string | undefined;
  /** The caption under the first cell, such as "30 days ago". */
  readonly startLabel?: string | undefined;
  /** The caption under the last cell, such as "Today". */
  readonly endLabel?: string | undefined;
  /** The cells' height in pixels; 32 by default. */
  readonly height?: number | undefined;
}
