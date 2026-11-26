/**
 * Stackra file contract:
 * Purpose: `TamoReportPart`, the data of a `data-tamo-report` part: a titled report of sections.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoReportSection } from "#contracts/types/tamo-report-section.type";

/** A report in a chat turn. */
export interface TamoReportPart {
  /** The report's title. */
  readonly title: string;

  /** The sections, in order. */
  readonly sections: readonly TamoReportSection[];
}
