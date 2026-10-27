/**
 * Stackra file contract:
 * Purpose: `expectNoAxeFindings`, the accessibility scan a route suite ends with (`entity-picker.e2e.test.ts`), holding the same
 *          line as `playground.e2e.test.ts`: axe over WCAG 2.0 to 2.2 (A and AA) and best practices, with no violation
 *          and nothing left incomplete.
 * Boundary: test support only; it declares no test and is not matched by the Playwright config.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Scans the page as it is now, and fails on any axe violation or any check axe leaves for review. */
export async function expectNoAxeFindings(page: Page): Promise<void> {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const report = (results: typeof violations) =>
    results.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .map((n) => `${n.target.join(" ")} ${n.failureSummary ?? ""}`)
          .join(" | ")}`,
    );
  expect(report(violations), "axe violations").toEqual([]);
  expect(report(incomplete), "axe checks left for review").toEqual([]);
}
