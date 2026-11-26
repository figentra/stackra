/**
 * Stackra file contract:
 * Purpose: `TamoSuggestionsPart`, the data of a `data-tamo-suggestions` part: follow-up prompts the person
 *          may send.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** Follow-up suggestions in a chat turn. */
export interface TamoSuggestionsPart {
  /** The prompts, in order. */
  readonly items: readonly string[];
}
