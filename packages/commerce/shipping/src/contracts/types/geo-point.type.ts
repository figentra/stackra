/**
 * Stackra file contract:
 * Purpose: `GeoPoint`, a place on the map as latitude and longitude in decimal degrees: a stop, a depot or a matrix
 *          origin or destination.
 * Boundary: a type in the leaf entry. Personal data when it is a customer's door; geocoding an address into a point is
 *           OS geography's port, not this package's.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (routing ports in @stackra/shipping); GRO-129; GRO-136.
 */

/**
 * A place on the map in decimal degrees: a stop, a depot or a matrix origin or destination.
 *
 * @example
 * const depot: GeoPoint = { latitude: 24.7136, longitude: 46.6753 };
 */
export interface GeoPoint {
  /** Latitude in decimal degrees, -90 to 90. */
  readonly latitude: number;

  /** Longitude in decimal degrees, -180 to 180. */
  readonly longitude: number;
}
