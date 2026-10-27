/**
 * Stackra file contract:
 * Purpose: the Theme Studio's end-to-end checks.
 *          - A link with knobs opens the derived theme in the preview.
 *          - A slider writes its knob to the address, and the changes-only export then carries it.
 *          - Undo takes it back.
 *          - A bad import is refused with the reason.
 *          - The page passes axe with a custom accent in both schemes and directions.
 *          The route itself is also in the general suite's light, dark, LTR and RTL run.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const previewVariable = (page: Page, name: string) =>
  page
    .getByRole("region", { name: "Preview" })
    .locator("[data-theme]")
    .evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), name);

test("a link with knobs opens the derived theme in the preview", async ({ page }) => {
  await page.goto("/theme-studio?scheme=light&locale=en&accent=40,0.16&radius=8");
  expect(await previewVariable(page, "--accent")).toBe("oklch(0.52 0.16 40)");
  expect(await previewVariable(page, "--radius")).toBe("8px");
});

test("a slider writes the address and the changes-only export; undo takes it back", async ({
  page,
}) => {
  await page.goto("/theme-studio?scheme=light&locale=en");
  await page.getByRole("slider", { name: "Corner radius" }).fill("12");
  await expect(page).toHaveURL(/radius=12/);
  await page.getByRole("button", { name: "Format" }).click();
  await page.getByRole("option", { name: "Changes" }).click();
  await expect(page.getByRole("region", { name: /the export/ })).toContainText('"base": "12px"');
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page).not.toHaveURL(/radius=/);
});

test("a bad import is refused with the reason", async ({ page }) => {
  await page.goto("/theme-studio?scheme=dark&locale=en");
  await page.getByRole("textbox", { name: "Paste a theme JSON" }).fill('{"format":"figma/9"}');
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByRole("alert")).toContainText('"figma/9" is not a theme format');
});

for (const scheme of ["light", "dark"] as const)
  for (const locale of ["en", "ar"] as const)
    test(`a custom theme passes axe in ${scheme}, ${locale}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/theme-studio?scheme=${scheme}&locale=${locale}&accent=295,0.15&hue=290`);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
      expect(incomplete.map((v) => v.id)).toEqual([]);
    });
