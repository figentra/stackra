/**
 * Stackra file contract:
 * Purpose: `TimeWindow`, an interval between two ISO 8601 instants with offsets: a stop's delivery slot or a vehicle's
 *          shift.
 * Boundary: a type in the leaf entry; strings, like `PickupRequest.from` and `to`, so it crosses the wire unchanged.
 *           `from` is never after `to`.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (stops, windows and shifts); GRO-129.
 */

/**
 * The span of time a stop may be served in or a vehicle may work.
 *
 * @example
 * const slot: TimeWindow = { from: "2026-10-25T09:00:00+03:00", to: "2026-10-25T11:00:00+03:00" };
 */
export interface TimeWindow {
  /** The first instant, ISO 8601 with an offset. */
  readonly from: string;

  /** The last instant, ISO 8601 with an offset. */
  readonly to: string;
}
