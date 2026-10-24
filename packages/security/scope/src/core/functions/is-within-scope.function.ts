/**
 * Stackra file contract:
 * Purpose: `isWithinScope(path, scope)`, whether a node's path is the scope's own path or one below it: the `ltree`
 *          `path <@ scope` test, done on the strings, which grant checks and the memory tree use.
 * Boundary: pure; compares whole labels, so `platform.acme_eu` is not within `platform.acme`. It validates neither
 *           path: a caller with untrusted input checks it with `isScopePath` first.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 7); ADR 0208 (decision 1: grants inherit downward).
 */

/**
 * Whether `path` is at or below `scope`.
 *
 * @example
 * isWithinScope("platform.acme.eu", "platform.acme"); // true
 * isWithinScope("platform.acme_eu", "platform.acme"); // false
 */
export function isWithinScope(path: string, scope: string): boolean {
  return path === scope || path.startsWith(`${scope}.`);
}
