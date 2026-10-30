/**
 * Stackra file contract:
 * Purpose: `choroplethShapesOf`, a GeoJSON FeatureCollection's polygons projected into a `width` × `height` box: an
 *          equirectangular projection (longitude scaled by the cosine of the middle latitude, so shapes keep their
 *          proportions near it), fitted to the box with its aspect kept and centred.
 * Boundary: pure; features without a polygon are left out. Good for a country or a city, not for a world map (no
 *           antimeridian handling).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same projection on web and native); RFC 7946; STA-1371.
 */
import type { GeoFeatureCollection } from "#contracts/types/geo-feature-collection.type";
import type { ChoroplethShape } from "#core/types/choropleth-shape.type";

/** What the projection reads beyond the regions. */
interface ChoroplethBox {
  readonly width: number;
  readonly height: number;
  /** The margin kept clear round the map; 4 by default. */
  readonly padding?: number;
  readonly idKey?: string | undefined;
  readonly nameKey?: string | undefined;
  readonly values: Readonly<Record<string, number>>;
}

/**
 * The regions as SVG paths in the box.
 * @example choroplethShapesOf(collection, { width: 300, height: 200, values: { a: 3 } });
 */
export function choroplethShapesOf(
  collection: GeoFeatureCollection,
  box: ChoroplethBox,
): ChoroplethShape[] {
  const { width, height, padding = 4, idKey = "id", nameKey = "name", values } = box;
  const features = collection.features.flatMap((feature) => {
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") return [{ feature, polygons: [geometry.coordinates] }];
    if (geometry?.type === "MultiPolygon") return [{ feature, polygons: geometry.coordinates }];
    return [];
  });
  const points = features.flatMap(({ polygons }) => polygons.flat(2));
  if (points.length === 0) return [];
  const lons = points.map((point) => point[0] ?? 0);
  const lats = points.map((point) => point[1] ?? 0);
  const middle = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180);
  const squeeze = Math.cos(middle);
  const x0 = Math.min(...lons) * squeeze;
  const x1 = Math.max(...lons) * squeeze;
  const y0 = -Math.max(...lats);
  const y1 = -Math.min(...lats);
  const scale = Math.min(
    (width - padding * 2) / Math.max(x1 - x0, 1e-9),
    (height - padding * 2) / Math.max(y1 - y0, 1e-9),
  );
  const dx = (width - (x1 - x0) * scale) / 2;
  const dy = (height - (y1 - y0) * scale) / 2;
  const project = ([lon = 0, lat = 0]: readonly number[]) =>
    `${(dx + (lon * squeeze - x0) * scale).toFixed(1)} ${(dy + (-lat - y0) * scale).toFixed(1)}`;
  return features.map(({ feature, polygons }, index) => {
    const id = String(feature.properties?.[idKey] ?? index);
    const value = values[id];
    return {
      id,
      name: String(feature.properties?.[nameKey] ?? id),
      path: polygons
        .flatMap((rings) => rings.map((ring) => `M ${ring.map(project).join(" L ")} Z`))
        .join(" "),
      value: typeof value === "number" && Number.isFinite(value) ? value : null,
    };
  });
}
