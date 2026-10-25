/**
 * Stackra file contract:
 * Purpose: `isScopePath(value)`, whether a string is a scope path this package writes: one or more labels of 1 to 63
 *          characters from `a-z`, `0-9` and `_`, joined by dots, at most 2048 characters.
 * Boundary: pure; the check an untrusted header or claim passes before it reaches a query or a session setting, and
 *           the label rule of a new node. It is narrower than `ltree` itself (no capitals, no hyphen), so every path it
 *           accepts is a valid `ltree`.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 7); `.agents/rules/tenancy.md` (point 4: validate the header).
 */

/** Labels of `a-z`, `0-9` and `_`, joined by dots. */
const SCOPE_PATH = /^[a-z0-9_]{1,63}(?:\.[a-z0-9_]{1,63})*$/;

/**
 * Whether `value` is a scope path.
 *
 * @example
 * isScopePath("platform.acme"); // true
 * isScopePath("platform.*"); // false
 */
export function isScopePath(value: string): boolean {
  return value.length <= 2048 && SCOPE_PATH.test(value);
}
