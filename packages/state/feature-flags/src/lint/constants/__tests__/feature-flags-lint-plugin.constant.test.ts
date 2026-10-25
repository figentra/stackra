/**
 * Stackra file contract:
 * Purpose: unit tests of `FEATURE_FLAGS_LINT_PLUGIN`: named `feature-flags`, it registers exactly `no-plan-targeting`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0129.
 */
import { describe, expect, it } from "@stackra/testing";

import { FEATURE_FLAGS_LINT_PLUGIN } from "#lint/constants/feature-flags-lint-plugin.constant";
import { NO_PLAN_TARGETING_RULE } from "#lint/constants/no-plan-targeting-rule.constant";

describe("FEATURE_FLAGS_LINT_PLUGIN", () => {
  it("is the feature-flags plugin with its one rule", () => {
    expect(FEATURE_FLAGS_LINT_PLUGIN.meta.name).toBe("feature-flags");
    expect(FEATURE_FLAGS_LINT_PLUGIN.rules).toEqual({
      "no-plan-targeting": NO_PLAN_TARGETING_RULE,
    });
  });
});
