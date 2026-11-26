/**
 * Stackra file contract:
 * Purpose: `coverageThresholdsFor(name)`, the coverage floor of one package: `STRICT_COVERAGE_THRESHOLDS` for the
 *          packages ADR 0182 names, `COVERAGE_THRESHOLDS` for every other member (and for a member with no name).
 * Boundary: pure; returns a fresh object the caller may extend.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors per package group).
 */
import { COVERAGE_THRESHOLDS } from "../constants/coverage-thresholds.constant.ts";
import { STRICT_COVERAGE_PACKAGES } from "../constants/strict-coverage-packages.constant.ts";
import { STRICT_COVERAGE_THRESHOLDS } from "../constants/strict-coverage-thresholds.constant.ts";

/**
 * The coverage floor of a package.
 *
 * @param name - the package name from its `package.json`, or `undefined` when it has none.
 * @returns lines, functions and branches percentages the package must reach.
 * @example
 * coverageThresholdsFor("@stackra/iam"); // { lines: 90, functions: 90, branches: 80 }
 * coverageThresholdsFor("@stackra/cache"); // { lines: 80, functions: 80, branches: 70 }
 */
export function coverageThresholdsFor(name: string | undefined): {
  lines: number;
  functions: number;
  branches: number;
} {
  const strict = name !== undefined && STRICT_COVERAGE_PACKAGES.includes(name);
  return { ...(strict ? STRICT_COVERAGE_THRESHOLDS : COVERAGE_THRESHOLDS) };
}
