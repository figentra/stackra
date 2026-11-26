/**
 * Stackra file contract:
 * Purpose: `CoverageOverrides`, the per-package changes `withCoverage` applies on top of the shared block.
 * Boundary: a type only; each override needs a reason in the package.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0007 (documentation).
 */
/** The per-package changes `withCoverage` applies on top of the shared block. Each one needs a reason in the package. */
export interface CoverageOverrides {
  /** Additional exclude globs appended to the shared list. */
  exclude?: string[];
  /** Lower a threshold — only with a documented reason in the package's vitest.config.ts. */
  thresholds?: Partial<Record<"lines" | "functions" | "branches", number>>;
}
