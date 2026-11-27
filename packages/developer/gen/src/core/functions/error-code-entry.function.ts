/**
 * Stackra file contract:
 * Purpose: `errorCodeEntry(code)`, the error-code reference row of `code`: the exact code first, then the same code
 *          in another case (`runwaylockederror` finds `RunwayLockedError`), or `undefined` when the page lists no such
 *          code.
 * Boundary: pure; reads `ERROR_CODES` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); STA-2891.
 */
import { ERROR_CODES } from "#core/constants/error-codes.constant";
import type { ErrorCodeEntry } from "#core/types/error-code-entry.type";

/** The rows by code, and by lower-cased code for a match in another case. */
const BY_CODE = new Map(ERROR_CODES.map((entry) => [entry.code, entry] as const));
const BY_LOWER = new Map(ERROR_CODES.map((entry) => [entry.code.toLowerCase(), entry] as const));

/**
 * The reference row of `code`.
 *
 * @param code - a code as a tool printed it, or typed in another case.
 * @returns the row, or `undefined` when the reference lists no such code.
 * @example
 * errorCodeEntry("shape_number_kind")?.group; // "Shapes and fields"
 */
export function errorCodeEntry(code: string): ErrorCodeEntry | undefined {
  const typed = code.trim();
  return BY_CODE.get(typed) ?? BY_LOWER.get(typed.toLowerCase());
}
