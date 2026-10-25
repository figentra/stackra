/**
 * Stackra file contract:
 * Purpose: unit tests of `noViolations`: minor and moderate findings pass, a serious or critical one fails, and the
 *          message names each blocking rule with its impact, node count and help.
 * Boundary: test only; the reports are written by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0183 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { AxeReport } from "#e2e/axe/axe-report.type";
import { noViolations } from "#e2e/axe/no-violations.function";

/** One violation of `impact`. */
const violation = (id: string, impact: string) => ({
  id,
  impact,
  help: `${id} help`,
  nodes: [{}, {}],
});

describe(noViolations, () => {
  it("passes minor and moderate findings", () => {
    const report: AxeReport = {
      violations: [violation("region", "moderate"), violation("list", "minor")],
    };
    expect(noViolations(report).pass).toBe(true);
  });

  it("fails a serious or critical finding and names it", () => {
    const report: AxeReport = {
      violations: [violation("color-contrast", "serious"), violation("region", "moderate")],
    };
    const result = noViolations(report);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("- color-contrast (serious, 2 nodes): color-contrast help");
    expect(result.message()).not.toContain("region");
  });
});
