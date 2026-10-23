/**
 * Stackra file contract:
 * Purpose: the close-button route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every close button is named by its label, and each is at least 24 by 24
 *          CSS pixels (WCAG 2.2 SC 2.5.8); the disabled one refuses presses; and dismissing the sample notice by
 *          keyboard hides it until Show again.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2 and 2.5.8; ADR 0182 (test
 *          tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:FR-027 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const LABELS = ["Close", "Dismiss with a custom icon", "Close (disabled)", "Dismiss notice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/close-button?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Close button" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the close-button page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(
        violations.map((finding) => finding.id),
        "axe violations",
      ).toEqual([]);
      expect(
        incomplete.map((finding) => finding.id),
        "axe checks left for review",
      ).toEqual([]);
    });

test("every close button is named by its label and is at least 24 by 24 pixels", async ({
  page,
}) => {
  await open(page, "light", "en");
  for (const name of LABELS) {
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toHaveCount(1);
    const box = await button.boundingBox();
    if (!box) throw new Error(`${name} has no box`);
    expect(box.width, name).toBeGreaterThanOrEqual(24);
    expect(box.height, name).toBeGreaterThanOrEqual(24);
  }
});

test("the disabled close button refuses presses", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("button", { name: "Close (disabled)" })).toBeDisabled();
});

test("dismissing the notice by keyboard hides it until Show again", async ({ page }) => {
  await open(page, "light", "en");
  const notice = page.getByRole("heading", { level: 3, name: "Your changes were saved" });
  await expect(notice).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notice" }).focus();
  await page.keyboard.press("Enter");
  await expect(notice).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("The notice is hidden.");
  await page.getByRole("button", { name: "Show again" }).click();
  await expect(notice).toBeVisible();
});

test("the keyboard focus ring shows on a focused close button", async ({ page }) => {
  await open(page, "light", "en");
  const close = page.getByRole("button", { name: "Close", exact: true });
  await close.focus();
  // Moving away and back by keyboard puts the page in keyboard modality, which is what the ring needs.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await expect(close).toHaveAttribute("data-focus-visible", "true");
});
