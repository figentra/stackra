/**
 * Stackra file contract:
 * Purpose: `ChoroplethShape`, one projected region of a choropleth map: its SVG path in the box, its id, name and value
 *          (`choroplethShapesOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** One region, ready to draw. */
export interface ChoroplethShape {
  readonly id: string;
  readonly name: string;
  /** Its outline and holes as one SVG path, for the even-odd fill rule. */
  readonly path: string;
  /** Its value, or null when the caller gave none. */
  readonly value: number | null;
}
