/**
 * Stackra file contract:
 * Purpose: `axe(page)`, the accessibility check of a journey's current screen: axe-core over the page with the WCAG 2.x
 *          A and AA rules; `expect(await axe(page)).toHaveNoViolations()`.
 * Boundary: checks and returns; asserts nothing itself. The gate (serious or critical fails) is the matcher's. Works on
 *           a browser page and on an Electron window alike.
 * Runtime: node
 * Governing contract: ADR 0183 (decision 2: axe on every journey); ADR 0269 (decision 6).
 */
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import type { AxeReport } from "#e2e/axe/axe-report.type";

/** The WCAG rule sets every journey is checked against. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Runs axe-core on `page`.
 *
 * @example
 * await expect(await axe(page)).toHaveNoViolations();
 */
export async function axe(page: Page): Promise<AxeReport> {
  return await new AxeBuilder({ page }).withTags(TAGS).analyze();
}
