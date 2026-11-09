/**
 * Stackra file contract:
 * Purpose: `TamoFormPart`, the data of a `data-tamo-form` part: an action's form, prefilled for the person to
 *          check and send.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** A prefilled action form in a chat turn. */
export interface TamoFormPart {
  /** The key of the action the form sends. */
  readonly actionKey: string;

  /** The prefilled input, keyed by field; the action validates it when the person sends it. */
  readonly values: Readonly<Record<string, unknown>>;
}
