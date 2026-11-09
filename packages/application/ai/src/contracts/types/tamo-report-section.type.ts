/**
 * Stackra file contract:
 * Purpose: `TamoReportSection`, one section of a `TamoReportPart`: an optional heading and text, and the ids
 *          of the turn's parts it embeds.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One section of a report. */
export interface TamoReportSection {
  /** The section's heading. */
  readonly heading?: string | undefined;

  /** The section's text. */
  readonly text?: string | undefined;

  /** The ids of the data parts of the same turn drawn in this section, in order. */
  readonly partIds?: readonly string[] | undefined;
}
