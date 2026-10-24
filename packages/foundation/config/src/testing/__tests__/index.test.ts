/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: importing it registers the config plugin, so every
 *          `TestingModuleBuilder` has `.withConfig` and `.withSecrets`, and the entry exports the plugin and nothing
 *          else.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { TestingModuleBuilder } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/config/testing", () => {
  it("exports exactly the plugin, already registered", () => {
    expect(Object.keys(testing)).toEqual(["CONFIG_TESTING_PLUGIN"]);
    expect(testing.CONFIG_TESTING_PLUGIN.name).toBe("@stackra/config");
    expect(TestingModuleBuilder.prototype.withConfig).toBeTypeOf("function");
    expect(TestingModuleBuilder.prototype.withSecrets).toBeTypeOf("function");
  });
});
