/**
 * Stackra file contract:
 * Purpose: `RouteVehicle`, one vehicle and driver a route planner fills: its id, where it starts and ends, its shift
 *          and its capacity per compartment.
 * Boundary: a type in the leaf entry. Vehicle limits are the caller's settings data (STA-747), never named here.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (vehicle capacity and compartments, shifts); GRO-129.
 */
import type { GeoPoint } from "#contracts/types/geo-point.type";
import type { TimeWindow } from "#contracts/types/time-window.type";

/**
 * A vehicle.
 *
 * @example
 * const van: RouteVehicle = { vehicleId: "van_1", start: depot, shift, capacity: { chilled: 20, ambient: 60 } };
 */
export interface RouteVehicle {
  /** The caller's id of the vehicle or shift. */
  readonly vehicleId: string;

  /** Where the route starts. */
  readonly start: GeoPoint;

  /** Where the route ends; the route is open (it ends at the last stop) when absent. */
  readonly end?: GeoPoint;

  /** When the vehicle works. */
  readonly shift: TimeWindow;

  /** Units it carries per compartment code. */
  readonly capacity: Readonly<Record<string, number>>;
}
