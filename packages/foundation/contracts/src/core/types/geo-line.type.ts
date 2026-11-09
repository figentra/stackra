/**
 * Stackra file contract:
 * Purpose: `GeoLine`, a path on the earth: two or more `GeoPoint`s in order, WGS 84. A model's `GeoLine` field is a
 *          PostGIS `geography(LineString,4326)` column (ADR 0314).
 * Boundary: a type only; the column, its GiST index and the ORM conversion live in @stackra/database and
 *           @stackra/model.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07); STA-1432.
 */
import type { GeoPoint } from "#core/types/geo-point.type";

/**
 * A line through its points, first to last.
 *
 * @example
 * const route: GeoLine = [{ latitude: 24.71, longitude: 46.67 }, { latitude: 24.75, longitude: 46.7 }];
 */
export type GeoLine = readonly GeoPoint[];
