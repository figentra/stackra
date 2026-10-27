/**
 * Stackra file contract:
 * Purpose: `CoverageOverrides`, the per-package changes `withCoverage` applies on top of the shared block.
 * Boundary: a type only; each override needs a reason in the package.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0007 (documentation).
 */
import type { COVERAGE_THRESHOLDS } from "../constants/coverage-thresholds.constant.ts";

/** The per-package changes `withCoverage` applies on top of the shared block. Each one needs a reason in the package. */
export interface CoverageOverrides {
  /** Additional exclude globs appended to the shared list. */
  exclude?: string[];
  /** Lower a threshold — only with a documented reason in the package's vitest.config.ts. */
  thresholds?: Partial<typeof COVERAGE_THRESHOLDS>;
}
