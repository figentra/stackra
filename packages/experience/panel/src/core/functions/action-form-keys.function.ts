/**
 * Stackra file contract:
 * Purpose: `actionFormKeys(input, idKey)`, the input keys a record action's modal form asks for: every top-level key but
 *          the record id, when at least one of them is required; none when the record id is all the action needs.
 * Boundary: internal; reads the top-level shape of a zod object schema and asks each field whether it takes
 *           `undefined` (optional and default fields do). Web and native pages share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: the record id and other required fields open a modal form).
 */
import type { ZodType } from "zod";

/**
 * The keys the modal form of an action over `input` draws, or none when the button runs with the record id alone.
 *
 * @example
 * actionFormKeys(ModerateReviewAction.input, "reviewId"); // ["decision", "note"]
 */
export function actionFormKeys(input: ZodType | undefined, idKey: string): string[] {
  const shape = (input as { readonly shape?: Readonly<Record<string, ZodType>> } | undefined)
    ?.shape;
  if (shape === undefined) return [];
  const keys = Object.keys(shape).filter((key) => key !== idKey);
  return keys.some((key) => shape[key]?.safeParse(undefined).success === false) ? keys : [];
}
