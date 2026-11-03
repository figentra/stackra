/**
 * Stackra file contract:
 * Purpose: `markerPointsOf(markers, box)`, where each pin of a `MarkerMap` sits in an SVG box: the same equirectangular
 *          projection `choroplethShapesOf` draws regions with (longitude squeezed by the cosine of the middle
 *          latitude), fitted to the pins' extent inside the box's padding and centred.
 * Boundary: pure; one pin, or pins in one place, sit at the centre. North is up and east is right in every reading
 *           direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1981.
 */
import type { MapMarker } from "#react/marker-map/map-marker.type";

/**
 * The pins as points in the box.
 * @example markerPointsOf([{ id: "a", latitude: 24.7, longitude: 46.7, label: "Riyadh" }], { width: 1000, height: 600 });
 */
export function markerPointsOf(
  markers: readonly MapMarker[],
  box: { readonly width: number; readonly height: number; readonly padding?: number },
): { readonly id: string; readonly x: number; readonly y: number }[] {
  const { width, height, padding = 32 } = box;
  if (markers.length === 0) return [];
  const lats = markers.map((marker) => marker.latitude);
  const squeeze = Math.cos(((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180));
  const xs = markers.map((marker) => marker.longitude * squeeze);
  const ys = lats.map((lat) => -lat);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const spanX = x1 - x0;
  const spanY = y1 - y0;
  const scale = Math.min(
    spanX > 0 ? (width - padding * 2) / spanX : Infinity,
    spanY > 0 ? (height - padding * 2) / spanY : Infinity,
  );
  const fit = Number.isFinite(scale) ? scale : 0;
  return markers.map((marker, index) => ({
    id: marker.id,
    x: width / 2 + ((xs[index] ?? 0) - (x0 + x1) / 2) * fit,
    y: height / 2 + ((ys[index] ?? 0) - (y0 + y1) / 2) * fit,
  }));
}
