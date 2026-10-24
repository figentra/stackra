/**
 * Stackra file contract:
 * Purpose: `validate(Class, input)`, which checks untrusted input against a shape class's generated schema and returns
 *          zod's `{ success, data, error }`: the one way a route's `submit`, a form or a test checks a shape.
 * Boundary: finds the schema through the registry (`schemaOf`), never by compiling the class at runtime. A class with
 *           no registered schema throws; invalid input never throws, it returns `success: false` with the issues,
 *           whose messages are the i18n keys the shape declared.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0055 (decision 1: the client validates with the API's
 *                     schemas); registry v3.1 gap G1.
 */
import type { AnyClass } from "@stackra/container";
import type { ZodSafeParseError, ZodSafeParseResult } from "zod";

import { instantiate } from "#core/functions/instantiate.function";
import { schemaOf } from "#core/functions/schema-of.function";

/**
 * Parses `input` with the schema registered for `type`.
 *
 * @returns `{ success: true, data }` with an instance of `type` (defaults applied), or `{ success: false, error }`.
 * @throws TypeError when no schema is registered for `type`.
 * @example
 * const form = validate(QuickOrderForm, await ctx.formData());
 * if (!form.success) return ctx.fieldErrors(form.error);
 */
export function validate<T extends object>(
  type: AnyClass<T>,
  input: unknown,
): ZodSafeParseResult<T> {
  const result = schemaOf(type).safeParse(input);
  if (!result.success) return result as ZodSafeParseError<T>;
  return { success: true, data: instantiate(type, result.data) };
}
