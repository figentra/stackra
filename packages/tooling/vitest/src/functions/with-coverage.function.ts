/**
 * Stackra file contract:
 * Purpose: `withCoverage(config, overrides)`, which wraps a member's vitest config with the shared coverage block at
 *          that member's floor: the package named in `<root>/package.json` (the config's `root`, else the working
 *          directory a `test:coverage` script runs in) gets `coverageThresholdsFor(name)`.
 * Boundary: returns a new config; reads the member's package.json and runs no tests.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors per package group); ADR 0022 (test placement); ADR 0007
 *                     (documentation).
 */
import type { ViteUserConfig as UserConfig } from "vitest/config";

import { coverage } from "../constants/coverage.constant.ts";
import { coverageThresholdsFor } from "./coverage-thresholds-for.function.ts";
import { readPackageName } from "./read-package-name.function.ts";
import type { CoverageOverrides } from "../types/coverage-overrides.type.ts";

/**
 * Wrap a member's vitest config with the shared coverage block at the member's floor.
 *
 * @param config - the member's vitest config; its `root` (default: the working directory) names the member.
 * @param overrides - extra excludes, and a lowered threshold with its reason in the member's vitest.config.ts.
 * @returns the config with `test.coverage` set.
 * @example
 * export default withCoverage({ test: { include: ["src/**\/__tests__/**\/*.test.ts"] } });
 */
export function withCoverage<T extends UserConfig>(
  config: T,
  overrides: CoverageOverrides = {},
): T {
  const floor = coverageThresholdsFor(readPackageName(config.root ?? process.cwd()));
  return {
    ...config,
    test: {
      ...config.test,
      coverage: {
        ...coverage,
        exclude: [...coverage.exclude, ...(overrides.exclude ?? [])],
        thresholds: { ...coverage.thresholds, ...floor, ...overrides.thresholds },
      },
    },
  };
}
