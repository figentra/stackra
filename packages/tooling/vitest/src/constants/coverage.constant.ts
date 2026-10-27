/**
 * Stackra file contract:
 * Purpose: `coverage`, the shared `test.coverage` block every `packages/**` vitest config gets through
 *          `withCoverage()`.
 * Boundary: a frozen value; it runs no tests itself.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0007 (documentation).
 */
import type { ViteUserConfig as UserConfig } from "vitest/config";

import { COVERAGE_THRESHOLDS } from "./coverage-thresholds.constant.ts";

type CoverageOptions = NonNullable<NonNullable<UserConfig["test"]>["coverage"]>;

/**
 * The shared `test.coverage` block.
 * - `include: src/**` — an untested file counts (the v8 default only sees what a test imported).
 * - `src/encore/**` is excluded: the Encore-bound half of a package cannot load outside the Encore runtime.
 * - generated files, barrels, type-only, bin and test files carry no logic to measure.
 */
export const coverage = Object.freeze({
  provider: "v8",
  enabled: false,
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/**/__tests__/**",
    "src/**/*.test.{ts,tsx}",
    "src/**/*.d.ts",
    "src/**/index.{ts,tsx}",
    "src/generated/**",
    "src/encore/**",
    "src/**/__fixtures__/**",
    "src/**/testing/**",
    "src/bin/**",
  ],
  reporter: ["text-summary", "json-summary", "cobertura", "html"],
  reportsDirectory: "./coverage",
  reportOnFailure: true,
  thresholds: { ...COVERAGE_THRESHOLDS },
} satisfies CoverageOptions);
