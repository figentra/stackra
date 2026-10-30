/**
 * Stackra file contract:
 * Purpose: `TimelineDay`, one day group of a Timeline: the day's key, how many days ago it was, and its entries.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { TimelineItem } from "#contracts/types/timeline-item.type";

/** One day of a timeline. */
export interface TimelineDay {
  /** The day, `YYYY-MM-DD` in the shown time zone. */
  readonly key: string;
  /** 0 for today, 1 for yesterday, and so on (negative in the future). */
  readonly daysAgo: number;
  /** The day's first entry's instant, for writing the date. */
  readonly at: Date;
  /** The entries of the day, in their given order. */
  readonly items: readonly TimelineItem[];
}
