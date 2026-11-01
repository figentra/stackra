/**
 * Stackra file contract:
 * Purpose: `reportTotals(report)`, the `lines` and `duplicatedLines` of a jscpd JSON report with the duplicated
 *          percentage to two decimals (moved from `tools/scripts/duplication.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */
import type { JscpdReport } from "#node/duplication/types/jscpd-report.type";

/**
 * The totals of `report`; 0 percent for an empty scan.
 *
 * @param report - a jscpd JSON report.
 * @example
 * reportTotals({ statistics: { total: { lines: 300, duplicatedLines: 10 } } }); // { lines: 300, duplicated: 10, percentage: 3.33 }
 */
export function reportTotals(report: JscpdReport | undefined): {
  readonly lines: number;
  readonly duplicated: number;
  readonly percentage: number;
} {
  const total = report?.statistics?.total ?? {};
  const lines = Number(total.lines ?? 0);
  const duplicated = Number(total.duplicatedLines ?? 0);
  const percentage = lines > 0 ? Math.round((duplicated / lines) * 10_000) / 100 : 0;
  return { lines, duplicated, percentage };
}
