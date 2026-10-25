/**
 * Stackra file contract:
 * Purpose: `AxeReport`, the part of an axe-core result that `axe(page)` returns and `toHaveNoViolations` reads: each
 *          violated rule with its impact, its help text and the nodes that break it.
 * Boundary: a type only, structural, so the entry names no axe-core type and axe-core's own result fits it.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0183 (decision 2); ADR 0269 (decision 6).
 */

/** The violations of one axe run. */
export interface AxeReport {
  /** Every rule the page breaks; empty when it passes. */
  readonly violations: readonly {
    /** The axe rule id (`color-contrast`). */
    readonly id: string;
    /** `minor`, `moderate`, `serious` or `critical`. */
    readonly impact?: string | null;
    /** What the rule asks for. */
    readonly help: string;
    /** The offending nodes. */
    readonly nodes: readonly unknown[];
  }[];
}
