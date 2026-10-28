/**
 * Stackra file contract:
 * Purpose: `refusalCode`, the one derivation of a refusal code from its class name, `snake(class minus "Error")`:
 *          `OrderNotPayableError` gives `order_not_payable`. The runtime (`refusal.code`) and gen (the manifest's
 *          `errors[].code`) both call this function, so the two can never disagree.
 * Boundary: pure; no dependency. A name that is not PascalCase ending in `Error` is refused rather than guessed, so a
 *           class renamed by a bundler (`ForbiddenError$1`, `e`) fails loudly instead of returning a wrong code; the
 *           generated tool configs keep class names (ADR 0295 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: error code row), ADR 0231 (snake_case machine codes; acronyms cased as
 *                     words).
 */

/** PascalCase with at least one character before the `Error` suffix. */
const REFUSAL_CLASS_NAME = /^[A-Z][A-Za-z0-9]*Error$/;

/**
 * The refusal code of a refusal class name.
 *
 * @param className - the declared class name, such as `AccessLogWriteFailedError`.
 * @returns the snake_case code, such as `access_log_write_failed`.
 * @throws RangeError when the name is not PascalCase, has no stem, or does not end in `Error`.
 * @example
 * refusalCode("InsufficientPointsError"); // "insufficient_points"
 */
export function refusalCode(className: string): string {
  if (!REFUSAL_CLASS_NAME.test(className))
    throw new RangeError(
      `"${className}" is not a refusal class name: write PascalCase ending in "Error", such as OrderNotPayableError`,
    );
  return (
    className
      .slice(0, -"Error".length)
      .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
      // A one-letter word before the next one: NotAMember is not_a_member, not not_amember.
      .replaceAll(/([A-Z])([A-Z][a-z])/g, "$1_$2")
      .toLowerCase()
  );
}
