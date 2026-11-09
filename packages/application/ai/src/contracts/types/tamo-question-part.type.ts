/**
 * Stackra file contract:
 * Purpose: `TamoQuestionPart`, the data of a `data-tamo-question` part: a question Tamo asks, with optional
 *          choices.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoQuestionChoice } from "#contracts/types/tamo-question-choice.type";

/** A question in a chat turn. */
export interface TamoQuestionPart {
  /** The question's id; the answer names it. */
  readonly id: string;

  /** What Tamo asks. */
  readonly prompt: string;

  /** The choices; left out, the person answers in words. */
  readonly choices?: readonly TamoQuestionChoice[] | undefined;

  /** True when more than one choice may be picked. */
  readonly multiple?: boolean | undefined;
}
