/**
 * Stackra file contract:
 * Purpose: the playground's end-to-end and accessibility gate: every route, found by listing `src/routes/`, opened in
 *          light and dark and in left-to-right (en) and right-to-left (ar) through the URL, must render its h1, carry
 *          the scheme and direction on <html>, and pass axe (WCAG 2.0 to 2.2, A and AA) with no violation. A new
 *          route folder is covered without editing this file.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-350:FR-011 sta-350:P-007 sta-350:SC-002
import { readdirSync } from "node:fs";

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Each route folder's path: `/` for `home`, `/<folder>` for the others (the route classes follow this). */
const ROUTES = readdirSync(new URL("../../src/routes", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => (entry.name === "home" ? "/" : `/${entry.name}`));

const SCHEMES = ["light", "dark"] as const;
const LOCALES = [
  { locale: "en", dir: "ltr" },
  { locale: "ar", dir: "rtl" },
] as const;

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("the route list is not empty", () => {
  expect(ROUTES).toContain("/foundations");
});

for (const path of ROUTES)
  for (const scheme of SCHEMES)
    for (const { locale, dir } of LOCALES)
      test(`${path} in ${scheme}, ${dir}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(`${path}?scheme=${scheme}&locale=${locale}`);

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const html = page.locator("html");
        await expect(html).toHaveAttribute("data-theme", scheme);
        await expect(html).toHaveClass(new RegExp(`\\b${scheme}\\b`));
        await expect(html).toHaveAttribute("dir", dir);
        await expect(html).toHaveAttribute("lang", locale);

        const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        const found = violations.map(
          (v) =>
            `${v.id} (${v.impact}): ${v.nodes
              .map((n) => `${n.target.join(" ")} ${n.failureSummary ?? ""}`)
              .join(" | ")}`,
        );
        expect(found, "axe violations").toEqual([]);
      });

test("the switcher writes the scheme and direction to the URL and the document", async ({
  page,
}) => {
  await page.goto("/foundations?scheme=light&locale=en");
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("radio", { name: /العربية/ }).click();
  await expect(page).toHaveURL(/scheme=dark/);
  await expect(page).toHaveURL(/locale=ar/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
