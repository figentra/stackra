/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/config until `stackra gen` writes the entry barrels
 *          (STA-339). Importing it adds `.withConfig(Class, values)` and `.withSecrets(map)` to the testing module;
 *          gen's vitest config loads it for every member that depends on @stackra/config.
 * Boundary: names its one re-export and declares nothing; the plugin registers itself when its module loads, and
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it. Imports `.` and
 *           `@stackra/container/testing` only (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { CONFIG_TESTING_PLUGIN } from "#testing/constants/config-testing-plugin.constant";
