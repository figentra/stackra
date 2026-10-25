/**
 * Stackra file contract:
 * Purpose: `GeoPoint`, the fact value of a geo field: a point on the earth in decimal degrees.
 * Boundary: a type only. The radius operators measure the great-circle distance to it; the location column of a model
 *           is ADR 0314's, and a consumer maps it to this shape when it computes facts.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 3: geo operators).
 */

/** A point: `{ latitude: 25.2, longitude: 55.27 }`. */
export interface GeoPoint {
  /** Degrees north of the equator, from -90 to 90. */
  readonly latitude: number;

  /** Degrees east of Greenwich, from -180 to 180. */
  readonly longitude: number;
}
