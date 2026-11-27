/**
 * Stackra file contract:
 * Purpose: `testDiagnostics(summary)`, the failures of a Vitest run as diagnostics of phase `test`: one error per
 *          failed test (its file, then `<suite> > <test>: <first error line>`), or per test file that failed to load.
 * Boundary: pure. Vitest prints no code and no line for a failure, so neither is invented.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-2886.
 */
import type { Diagnostic } from "@stackra/console/contracts";

import type { TestSummary } from "#node/types/test-summary.type";

/**
 * The failures of `summary`, in the order printed.
 *
 * @param summary - a run's summary, or undefined when it printed none.
 * @example
 * testDiagnostics({ ...summary, failures: [{ file: "src/a.test.ts", test: "orders > cancels" }] })[0]?.message;
 * // "orders > cancels"
 */
export function testDiagnostics(summary: TestSummary | undefined): Diagnostic[] {
  return (summary?.failures ?? []).map((failure) => ({
    phase: "test",
    severity: "error",
    file: failure.file,
    message:
      [failure.test ?? "the file failed to load", failure.message].filter(Boolean).join(": ") ||
      "failed",
  }));
}
