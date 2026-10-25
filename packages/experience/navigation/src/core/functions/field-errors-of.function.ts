/**
 * Stackra file contract:
 * Purpose: `fieldErrorsOf(error)`, the field errors behind `ctx.fieldErrors`: one message per refused path, from a
 *          failed `validate(...)` (a zod error's issues, the first issue of a path winning) or from a refusal that
 *          carries `fieldErrors`.
 * Boundary: internal. Anything else is not a field problem and is rethrown, so the error boundary shows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (field errors); ADR 0055.
 */
import type { FieldErrors } from "@stackra/errors";
import { isRefusal } from "@stackra/errors";

/** A zod-like issue list. */
interface IssueList {
  readonly issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[];
}

/** Whether `error` holds a zod-like issue list. */
const hasIssues = (error: unknown): error is IssueList =>
  typeof error === "object" &&
  error !== null &&
  Array.isArray((error as Partial<IssueList>).issues);

/**
 * The field errors of `error`.
 *
 * @throws the error itself when it carries no field errors.
 * @example
 * fieldErrorsOf(validate(ContactInput, {}).error); // { email: "leads::errors.email_required", ... }
 */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (hasIssues(error)) {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) errors[issue.path.map(String).join(".")] ??= issue.message;
    return Object.freeze(errors);
  }
  if (isRefusal(error) && error.fieldErrors !== undefined) return error.fieldErrors;
  throw error;
}
