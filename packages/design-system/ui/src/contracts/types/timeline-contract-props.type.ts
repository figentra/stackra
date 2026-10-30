/**
 * Stackra file contract:
 * Purpose: `TimelineContractProps`, the props every runtime's `Timeline` takes: an activity feed of entries, newest
 *          first as given, grouped under day headings ("Today", "Yesterday", then the date), full or compact.
 * Boundary: types only; ordering is the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { TimelineItem } from "#contracts/types/timeline-item.type";

/** Props shared by the web and native `Timeline`. */
export interface TimelineContractProps {
  /** The entries, in the order they are shown. */
  readonly items: readonly TimelineItem[];
  /** False to show one list without day headings. Defaults to true. */
  readonly groupByDay?: boolean | undefined;
  /** `default` with bodies, or `compact`: one line per entry. */
  readonly variant?: "default" | "compact" | undefined;
  /** The list's name, for example "Order activity"; defaults to the catalogue's "Activity". */
  readonly label?: string | undefined;
  /** The time zone the days and times are shown in; defaults to the reader's. */
  readonly timeZone?: string | undefined;
  /** The moment "Today" is counted from; defaults to now. */
  readonly now?: Date | undefined;
}
