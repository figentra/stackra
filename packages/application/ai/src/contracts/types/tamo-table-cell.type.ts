/**
 * Stackra file contract:
 * Purpose: `TamoTableCell`, one value of a `TamoTablePart` row: text, a number, a yes or no, or nothing.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One value of a table row. */
export type TamoTableCell = string | number | boolean | null;
