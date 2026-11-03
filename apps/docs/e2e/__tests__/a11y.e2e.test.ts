/**
 * Stackra file contract:
 * Purpose: the accessibility check of the docs site that replaces `mint a11y` (STA-2026 FR-005): axe finds no WCAG 2.2
 *          AA violation on any page of the site, in light and dark, and a failure names the page and the rule.
 * Boundary: the prerendered site under `wrangler dev`; Chromium only. One test per page, so a run in parallel
 *           workers covers every page and the report names each failing one.
 * Runtime: node
 * Governing contract: ADR 0514; ADR 0182 (test tiers); ADR 0022 (test placement); STA-2026 (FR-005, research R8);
 *          WCAG 2.2 AA.
 */
import { readFileSync } from "node:fs";

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const PATHS = readFileSync(new URL("../fixtures/mintlify-sitemap.txt", import.meta.url), "utf8")
  .split("\n")
  .filter((path) => path.length > 0);

for (const path of PATHS)
  test(`${path} passes axe`, async ({ page }) => {
    const found: string[] = [];
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      for (const violation of violations)
        found.push(`${scheme}: ${violation.id} (${violation.nodes.length}) ${violation.help}`);
    }
    expect(found, path).toEqual([]);
  });
