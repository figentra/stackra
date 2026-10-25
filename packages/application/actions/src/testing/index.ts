/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/actions (`run`, `fakeActionContext`,
 *          `fakeExtensionContext`, `extension` and the testing-module plugin that adds `.withExtensions`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the plugin with the testing module;
 *           `sideEffects` stays `false` because only vitest loads `./testing` and never tree-shakes it. Imports `.`,
 *           `@stackra/container/testing` and `@stackra/testing` only; no other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { ACTIONS_TESTING_PLUGIN } from "#testing/constants/actions-testing-plugin.constant";
export { extension } from "#testing/functions/extension.function";
export { fakeActionContext } from "#testing/functions/fake-action-context.function";
export { fakeExtensionContext } from "#testing/functions/fake-extension-context.function";
export { run } from "#testing/functions/run.function";
export type { FakeActionContext } from "#testing/types/fake-action-context.type";
export type { RunOptions } from "#testing/types/run-options.type";
export type { RunResult } from "#testing/types/run-result.type";
export type { SlotKey } from "#testing/types/slot-key.type";
