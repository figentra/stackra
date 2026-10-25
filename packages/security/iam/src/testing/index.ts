/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/iam (`actors` and the testing-module plugin that
 *          connects the policies and opens the memory policy) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { actors } from "#testing/constants/actors.constant";
export { IAM_TESTING_PLUGIN } from "#testing/constants/iam-testing-plugin.constant";
