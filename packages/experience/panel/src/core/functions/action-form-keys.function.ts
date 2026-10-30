/**
 * Stackra file contract:
 * Purpose: `actionFormKeys(input, idKey)`, the input keys an action's modal form asks for: every top-level key but
 *          the record id (all of them for an action without a record); none when the record id is all the action takes.
 * Boundary: internal; reads the top-level shape of a zod object schema. An optional or defaulted field counts too, so an
 *           action with only optional fields still shows its form and confirmation. Web and native pages share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3 as amended 2026-10-30: the record id and other fields open a modal form).
 */
import type { ZodType } from "zod";

/**
 * The keys the modal form of an action over `input` draws, or none when the button runs with the record id alone.
 *
 * @example
 * actionFormKeys(ModerateReviewAction.input, "reviewId"); // ["decision", "note"]
 */
export function actionFormKeys(input: ZodType | undefined, idKey?: string): string[] {
  const shape = (input as { readonly shape?: Readonly<Record<string, ZodType>> } | undefined)
    ?.shape;
  return shape === undefined ? [] : Object.keys(shape).filter((key) => key !== idKey);
}
