/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the plugin, `runWorkflow` and `signal` are its values, and
 *          nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/workflow/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "WORKFLOW_TESTING_PLUGIN",
      "runDocument",
      "runWorkflow",
      "signal",
    ]);
  });
});
