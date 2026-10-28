/**
 * Stackra file contract:
 * Purpose: `partitionStart(instant, interval, offset)`, the UTC start of the partition `offset` spans after the one
 *          holding `instant`: a day at 00:00, a week from Monday, a month from its 1st, a year from 1 January.
 * Boundary: pure UTC calendar arithmetic; the partition after a start is `partitionStart(start, interval, 1)`. The
 *           partition name and its bounds both come from it, so they always agree.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps db12, sc4 (range partitions by time).
 */
import type { PartitionedOptions } from "@stackra/model";

/**
 * The start of a partition.
 *
 * @example
 * partitionStart(new Date("2026-10-28T14:00:00Z"), "month", 1); // 2026-11-01T00:00:00Z
 */
export function partitionStart(
  instant: Date,
  interval: PartitionedOptions["interval"],
  offset: number,
): Date {
  const year = instant.getUTCFullYear();
  const month = instant.getUTCMonth();
  const day = instant.getUTCDate();
  if (interval === "year") return new Date(Date.UTC(year + offset, 0, 1));
  if (interval === "month") return new Date(Date.UTC(year, month + offset, 1));
  if (interval === "week") {
    // getUTCDay: Sunday 0; ISO weeks start on Monday.
    const sinceMonday = (instant.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(year, month, day - sinceMonday + 7 * offset));
  }
  return new Date(Date.UTC(year, month, day + offset));
}
