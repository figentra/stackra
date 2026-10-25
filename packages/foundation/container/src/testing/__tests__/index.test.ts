/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `createTestingModule` and the `TestingApp` type the
 *          template imports, plus the plugin and wiring registration gen's vitest setup and other packages' testing
 *          entries call, are exported and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";
import type { ModuleRecord, TestingApp, TestingPlugin } from "#testing/index";

describe("@stackra/container/testing", () => {
  it("exports the testing module and its registration functions", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "TestingApp",
      "TestingModuleBuilder",
      "createTestingModule",
      "registerTestingPlugin",
      "registerWiring",
    ]);
  });

  it("exports the types the template and plugins name", () => {
    const types: [ModuleRecord, TestingApp, TestingPlugin] | undefined = undefined;
    expect(types).toBeUndefined();
  });
});
