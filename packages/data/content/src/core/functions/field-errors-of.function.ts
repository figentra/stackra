/**
 * Stackra file contract:
 * Purpose: `fieldErrorsOf`, the field errors of a refused custom field definition or values map: each refused path to
 *          one snake_case code.
 * Boundary: internal; the two checks of this package are its readers. The code is zod's issue code (`invalid_type`,
 *           `too_big`), a refinement's own message (`choices_required`), or `unrecognized_key` for each extra key. The
 *           first issue of a path wins, and no code echoes the refused value.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (field errors); ADR 0231 (snake_case codes).
 */
import type { FieldErrors } from "@stackra/errors";
import type { ZodError } from "zod";

/**
 * The field errors of `error`.
 *
 * @example
 * fieldErrorsOf(result.error); // { choices: "choices_required", "label.en": "too_big" }
 */
export function fieldErrorsOf(error: ZodError): FieldErrors {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const at = issue.path.map(String).join(".");
    if (issue.code === "unrecognized_keys")
      for (const key of issue.keys) errors[at === "" ? key : `${at}.${key}`] ??= "unrecognized_key";
    else errors[at === "" ? "(root)" : at] ??= issue.code === "custom" ? issue.message : issue.code;
  }
  return errors;
}
