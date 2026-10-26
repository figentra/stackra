/**
 * Stackra file contract:
 * Purpose: `checkForm`, a form document from untrusted input (a studio save, a seed pack) as a `FormDocument`, or a
 *          refusal with every problem by path.
 * Boundary: pure; the trust boundary of the form kind. It refuses what `formProblems` reports; a form that passes holds
 *           only registered field types and conditions over its own fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decisions 1 and 2); ADR 0115 (enforcement: unknown targets are refused).
 */
import { FORM_DOCUMENT_SCHEMA } from "#core/constants/form-document-schema.constant";
import { FormInvalidError } from "#core/errors/form-invalid.error";
import { formProblems } from "#core/functions/form-problems.function";
import type { FormDocument } from "#core/types/form-document.type";

/**
 * `input` as a checked form document.
 *
 * @throws FormInvalidError with one field error per problem.
 * @example
 * const form = checkForm(seed.document);
 */
export function checkForm(input: unknown): FormDocument {
  const fieldErrors = formProblems(input);
  if (Object.keys(fieldErrors).length > 0) throw FormInvalidError.create({}, { fieldErrors });
  return FORM_DOCUMENT_SCHEMA.parse(input);
}
