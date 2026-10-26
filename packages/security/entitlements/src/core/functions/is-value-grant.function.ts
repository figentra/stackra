/**
 * Stackra file contract:
 * Purpose: `isValueGrant`, whether a source's answer is a usable value grant: a number that is not NaN and not
 *          negative (`Number.POSITIVE_INFINITY` stands for "no bound", as it does for a limit).
 * Boundary: pure; used to refuse a malformed grant as a source bug before anything reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0408 (the numeric value kind); STA-824.
 */

/**
 * Whether `grant` is a value grant.
 *
 * @example
 * if (!isValueGrant(grant)) throw new TypeError("a value's source answers a number");
 */
export function isValueGrant(grant: unknown): grant is number {
  return typeof grant === "number" && !Number.isNaN(grant) && grant >= 0;
}
