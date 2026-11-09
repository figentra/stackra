/**
 * Stackra file contract:
 * Purpose: `TamoAnswerPart`, the data of a `data-tamo-answer` part: the person's answer to a question.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** The answer to a question in a chat turn. */
export interface TamoAnswerPart {
  /** The id of the question answered. */
  readonly questionId: string;

  /** The answer, keyed by field. */
  readonly values: Readonly<Record<string, unknown>>;
}
