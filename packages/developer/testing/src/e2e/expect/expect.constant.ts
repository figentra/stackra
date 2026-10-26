/**
 * Stackra file contract:
 * Purpose: `expect`, Playwright's `expect` with the house matcher `toHaveNoViolations` for `axe(page)`'s report.
 * Boundary: a new `expect` from Playwright's `expect.extend`; Playwright's own matchers (web-first assertions
 *           included) are unchanged.
 * Runtime: node
 * Governing contract: ADR 0183 (decision 2); ADR 0269 (decision 6).
 */
import { expect as base } from "@playwright/test";

import type { AxeReport } from "#e2e/axe/axe-report.type";
import { noViolations } from "#e2e/axe/no-violations.function";

/**
 * The e2e assertion function.
 *
 * @example
 * await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
 * await expect(await axe(page)).toHaveNoViolations();
 */
export const expect = base.extend({
  toHaveNoViolations(report: AxeReport) {
    return { ...noViolations(report), name: "toHaveNoViolations" };
  },
});
