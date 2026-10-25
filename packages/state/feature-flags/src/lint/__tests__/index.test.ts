/**
 * Stackra file contract:
 * Purpose: barrel test of the `./lint` entry: exactly the plugin (also the default export) and the rule.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as lint from "#lint/index";

describe("@stackra/feature-flags/lint", () => {
  it("exports exactly its values, the plugin as default", () => {
    expect(Object.keys(lint).sort()).toEqual([
      "FEATURE_FLAGS_LINT_PLUGIN",
      "NO_PLAN_TARGETING_RULE",
      "default",
    ]);
    expect(lint.default).toBe(lint.FEATURE_FLAGS_LINT_PLUGIN);
  });
});
