/**
 * Stackra file contract:
 * Purpose: `TamoQuestionChoice`, one choice of a `TamoQuestionPart`: the value sent back and its label.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One choice of a question. */
export interface TamoQuestionChoice {
  /** The value the answer carries. */
  readonly value: string;

  /** What the person sees. */
  readonly label: string;
}
