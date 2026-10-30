/**
 * Stackra file contract:
 * Purpose: `GeoFeatureCollection`, the part of a GeoJSON FeatureCollection (RFC 7946) a choropleth map reads: features
 *          with Polygon or MultiPolygon geometry in longitude and latitude, and their properties.
 * Boundary: types only. The caller brings the map; the design system ships no map data.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); RFC 7946; STA-1371.
 */

/** A GeoJSON FeatureCollection of polygons. */
export interface GeoFeatureCollection {
  /** The GeoJSON object type, always `FeatureCollection`. */
  readonly type: "FeatureCollection";
  /** The regions, each a polygon or multipolygon feature. */
  readonly features: readonly {
    readonly type: "Feature";
    readonly properties: Readonly<Record<string, unknown>> | null;
    readonly geometry:
      | {
          readonly type: "Polygon";
          /** Rings of `[longitude, latitude]` points; the first is the outline, the rest are holes. */
          readonly coordinates: readonly (readonly (readonly number[])[])[];
        }
      | {
          readonly type: "MultiPolygon";
          readonly coordinates: readonly (readonly (readonly (readonly number[])[])[])[];
        }
      | null;
  }[];
}
