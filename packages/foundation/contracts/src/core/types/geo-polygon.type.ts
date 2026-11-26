/**
 * Stackra file contract:
 * Purpose: `GeoPolygon`, an area on the earth: the outer ring of three or more `GeoPoint`s, first point not repeated
 *          at the end, WGS 84. A model's `GeoPolygon` field is a PostGIS `geography(Polygon,4326)` column (ADR 0314).
 * Boundary: a type only; the column, its GiST index and the ORM conversion live in @stackra/database and
 *           @stackra/model. shortcut: one outer ring and no holes; add an interior-rings shape when an area needs one.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPoint } from "#core/types/geo-point.type";

/**
 * An area as its outer ring; the ring closes back to the first point.
 *
 * @example
 * const zone: GeoPolygon = [
 *   { latitude: 24, longitude: 46 },
 *   { latitude: 24, longitude: 47 },
 *   { latitude: 25, longitude: 47 },
 * ];
 */
export type GeoPolygon = readonly GeoPoint[];
