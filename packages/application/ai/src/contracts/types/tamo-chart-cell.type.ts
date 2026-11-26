/**
 * Stackra file contract:
 * Purpose: `TamoChartCell`, one value of a `TamoChartPart` row: text, a number or nothing.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One value of a chart row. */
export type TamoChartCell = string | number | null;
