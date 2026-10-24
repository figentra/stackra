/**
 * Stackra file contract:
 * Purpose: what the `pro-*.e2e.test.ts` suites share: opening a page in a scheme and locale with reduced motion (so an
 *          overlay is settled when it is scanned), and the accessibility scan every suite ends with, which holds the
 *          same line as `playground.e2e.test.ts`: axe over WCAG 2.0 to 2.2 (A and AA) and best practices, with no
 *          violation and nothing left incomplete.
 * Boundary: test support only; it declares no test and is not matched by the Playwright config.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** The colour schemes every suite runs in. */
export const SCHEMES = ["light", "dark"] as const;

/** One of {@link SCHEMES}. */
export type Scheme = (typeof SCHEMES)[number];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Opens `path` in a scheme and locale (left to right, English, unless told otherwise) with reduced motion. */
export async function visit(
  page: Page,
  path: string,
  scheme: Scheme,
  locale: "en" | "ar" = "en",
): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(`${path}?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

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
