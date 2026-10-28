/**
 * Stackra file contract:
 * Purpose: `e164()`, the schema of a phone number field: the value as typed (spaces, hyphens, dots, parentheses and
 *          Arabic-Indic digits allowed, a leading `00` read as `+`) normalised to E.164 and checked for shape.
 * Boundary: shape only: a plus, a first digit from 1 and 8 to 15 digits in all. Whether a number exists, or fits its
 *           Market's mobile plan, is the Market's phone `IdentifierFormat` (pack data) and the verification flow.
 * Runtime: isomorphic
 * Governing contract: ITU-T E.164; round 3 #36; ADR 0305.
 */
import { z } from "zod";
import type { ZodType } from "zod";

import { normalizeIdentifier } from "#core/functions/normalize-identifier.function";
import type { E164 } from "#core/types/e164.type";

/** E.164: a plus, then 8 to 15 digits not starting with 0. */
const SHAPE = /^\+[1-9]\d{7,14}$/;

/**
 * A new schema of phone numbers, output in E.164.
 *
 * @example
 * e164().parse("00966 50 000 0001"); // "+966500000001"
 */
export function e164(): ZodType<E164, string> {
  return z.string().transform((value, context) => {
    const compact = normalizeIdentifier(value.replaceAll(/[().]/g, "")).replace(/^00/, "+");
    if (!SHAPE.test(compact)) {
      context.addIssue({
        code: "custom",
        message: "Expected a phone number in international form",
      });
      return z.NEVER;
    }
    return compact as E164;
  });
}
