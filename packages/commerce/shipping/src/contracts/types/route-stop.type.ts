/**
 * Stackra file contract:
 * Purpose: `RouteStop`, one delivery or collection a route planner places: its id, where it is, what it loads per
 *          compartment, its time window and how long the hand-over takes.
 * Boundary: a type in the leaf entry. Compartment codes (ambient, chilled, frozen, or any other) are the caller's
 *           settings data, never named here. Personal data: the location may be a customer's door.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (stops, windows, capacity and compartments); GRO-129.
 */
import type { GeoPoint } from "#contracts/types/geo-point.type";
import type { TimeWindow } from "#contracts/types/time-window.type";

/**
 * A stop.
 *
 * @example
 * const stop: RouteStop = { stopId: "ord_1", location, demand: { chilled: 2, ambient: 5 }, window: slot };
 */
export interface RouteStop {
  /** The caller's id of the stop. */
  readonly stopId: string;

  /** Where it is. */
  readonly location: GeoPoint;

  /** Units it takes per compartment code; a code the vehicle lacks cannot be carried. */
  readonly demand: Readonly<Record<string, number>>;

  /** When the vehicle may arrive; any time in the shift when absent. */
  readonly window?: TimeWindow;

  /** Hand-over time in whole seconds; 0 when absent. */
  readonly serviceS?: number;
}
