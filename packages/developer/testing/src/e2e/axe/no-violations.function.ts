/**
 * Stackra file contract:
 * Purpose: `noViolations(report)`, the body of the e2e `toHaveNoViolations` matcher: passes unless axe found a serious
 *          or critical violation, and lists each such rule with its impact, node count and help when it fails.
 * Boundary: internal to `./e2e` (not exported); pure. Minor and moderate findings never fail a journey.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0183 (decision 2: fail on serious or critical); ADR 0269 (decision 6).
 */
import type { AxeReport } from "#e2e/axe/axe-report.type";

/** The impacts that fail a journey. */
const BLOCKING = new Set(["serious", "critical"]);

/**
 * The matcher result for `report`.
 *
 * @example
 * noViolations({ violations: [] }).pass; // true
 */
export function noViolations(report: AxeReport): { pass: boolean; message: () => string } {
  const blocking = report.violations.filter((violation) => BLOCKING.has(violation.impact ?? ""));
  return {
    pass: blocking.length === 0,
    message: () =>
      blocking.length === 0
        ? "expected serious or critical accessibility violations, found none"
        : [
            `expected no serious or critical accessibility violations, found ${blocking.length}:`,
            ...blocking.map(
              (violation) =>
                `- ${violation.id} (${violation.impact}, ${violation.nodes.length} nodes): ${violation.help}`,
            ),
          ].join("\n"),
  };
}
