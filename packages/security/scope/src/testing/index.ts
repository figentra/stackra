/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/scope (`scopeRefOf` and `fakeScopeTree`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; no other package's
 *           `./testing` (ADR 0269 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); ADR 0327 (decision 10).
 */
export { fakeScopeTree } from "#testing/functions/fake-scope-tree.function";
export { scopeRefOf } from "#testing/functions/scope-ref-of.function";
