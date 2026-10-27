/**
 * Stackra file contract:
 * Purpose: `withCoverage(config, overrides)`, which wraps a package's vitest config with the shared coverage block.
 * Boundary: returns a new config; it runs no tests.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0007 (documentation).
 */
import type { ViteUserConfig as UserConfig } from "vitest/config";

import { coverage } from "../constants/coverage.constant.ts";
import type { CoverageOverrides } from "../types/coverage-overrides.type.ts";

/** Wrap a package's vitest config with the shared coverage block. */
export function withCoverage<T extends UserConfig>(
  config: T,
  overrides: CoverageOverrides = {},
): T {
  return {
    ...config,
    test: {
      ...config.test,
      coverage: {
        ...coverage,
        exclude: [...coverage.exclude, ...(overrides.exclude ?? [])],
        thresholds: { ...coverage.thresholds, ...overrides.thresholds },
      },
    },
  };
}
