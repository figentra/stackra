/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/scope (`scopeRefOf`, `fakeScopeTree` and
 *          `SCOPE_TESTING_PLUGIN`, registered on import) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's entries and
 *           `@stackra/container/testing` (the plugin registry) only; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); ADR 0327 (decision 10).
 */
export { SCOPE_TESTING_PLUGIN } from "#testing/constants/scope-testing-plugin.constant";
export { fakeScopeTree } from "#testing/functions/fake-scope-tree.function";
export { scopeRefOf } from "#testing/functions/scope-ref-of.function";
