/**
 * Stackra file contract:
 * Purpose: `errorCodeDocs(code)`, the docs link of a code: the error-code reference with the heading of the code's
 *          group as the fragment (`…/customers/error-codes#shapes-and-fields`), or the page itself for a code it does
 *          not list, so a finding always has somewhere to point.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: refusals print their fix); STA-2853; STA-2891.
 */
import { ERROR_CODES_PAGE } from "#core/constants/error-codes-page.constant";
import { errorCodeEntry } from "#core/functions/error-code-entry.function";

/**
 * The docs link of `code`.
 *
 * @param code - a code as a tool printed it.
 * @returns the reference page, with the code's group heading as the fragment when the page lists the code.
 * @example
 * errorCodeDocs("shape_number_kind");
 * // "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields"
 */
export function errorCodeDocs(code: string): string {
  const entry = errorCodeEntry(code);
  return entry === undefined ? ERROR_CODES_PAGE : `${ERROR_CODES_PAGE}#${entry.anchor}`;
}
