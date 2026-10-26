/**
 * Stackra file contract:
 * Purpose: unit tests of `FEATURE_FLAGS_LINT_PLUGIN`: named `feature-flags`, it registers exactly `no-plan-targeting`,
 *          and its file and the rule's stay loadable from source by Node (no `#` value import).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0129.
 */
import { readFileSync } from "node:fs";

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

describe("the source-loaded plugin files", () => {
  it("import values only by relative .ts paths, so oxlint loads them without a dist", () => {
    for (const file of [
      "../feature-flags-lint-plugin.constant.ts",
      "../no-plan-targeting-rule.constant.ts",
    ]) {
      const text = readFileSync(new URL(file, import.meta.url), "utf8");
      const valueImports = [...text.matchAll(/^import (?!type )[^;]*from "([^"]+)";/gm)].map(
        (match) => match[1] ?? "",
      );
      for (const specifier of valueImports) expect(specifier).toMatch(/^\.\.?\/.*\.ts$/);
    }
  });
});
