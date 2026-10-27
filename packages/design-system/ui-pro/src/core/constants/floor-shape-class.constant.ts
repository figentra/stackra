/**
 * Stackra file contract:
 * Purpose: `FLOOR_SHAPE_CLASS`, the classes each floor-plan item shape draws with (a table's outline and corner, a
 *          wall's fill, a label's bare text), shared by the editor and the live map on web and native.
 * Boundary: internal; theme tokens only, so a kitchen or dark theme recolours the plan without new classes.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0302 (design tokens).
 */
import type { FloorItemShape } from "#contracts/enums/floor-item-shape.enum";

/** The classes of each item shape. */
export const FLOOR_SHAPE_CLASS: Readonly<Record<FloorItemShape, string>> = Object.freeze({
  rectangle: "rounded-md border border-border bg-surface",
  round: "rounded-full border border-border bg-surface",
  wall: "bg-foreground",
  label: "bg-transparent",
});
