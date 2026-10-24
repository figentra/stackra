/**
 * Stackra file contract:
 * Purpose: `TESTING_PLUGINS`, the testing-module plugins registered in this test process, by name.
 * Boundary: module state of the test process, written only by `registerTestingPlugin` and read by `compile()`. Not
 *           exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { TestingPlugin } from "#testing/types/testing-plugin.type";

/** Plugin name to the plugin. */
export const TESTING_PLUGINS = new Map<string, TestingPlugin>();
