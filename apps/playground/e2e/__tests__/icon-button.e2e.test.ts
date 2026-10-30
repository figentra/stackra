/**
 * Stackra file contract:
 * Purpose: the icon-button route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every button is named, and the name survives loading; every button is at
 *          least 24 by 24 CSS pixels (WCAG 2.2 SC 2.5.8); a press counts from the keyboard; and the keyboard focus
 *          ring shows.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2 and 2.5.8; ADR 0182 (test
 *          tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:FR-027 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/icon-button?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Icon button", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the icon-button page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every icon button has an accessible name and is at least 24 by 24 pixels", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The demos load lazily: every one mounted before the buttons are counted.
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
  // The page's own buttons only: the shell's switcher is not under test here.
  const buttons = await page.getByRole("main").getByRole("button").all();
  // One per variant in each of three sizes, then the states and the live samples.
  expect(buttons.length).toBeGreaterThanOrEqual(21);
  for (const button of buttons) {
    await expect(button).toHaveAccessibleName(/\S/);
    const box = await button.boundingBox();
    if (!box) throw new Error("a button has no box");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the keyboard presses the counter, and the loading one keeps its name and focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const count = page.getByTestId("press-count");
  const counter = page.getByRole("button", { name: "Count presses" });
  await counter.focus();
  await page.keyboard.press("Enter");
  await expect(count).toHaveText("Pressed 1 time.");
  await page.keyboard.press("Space");
  await expect(count).toHaveText("Pressed 2 times.");

  const load = page.getByRole("button", { name: "Load", exact: true });
  await load.focus();
  await page.keyboard.press("Enter");
  await expect(load).toHaveAttribute("aria-disabled", "true");
  await expect(load).toBeFocused();
  await expect(load).toHaveAccessibleName("Load");
  await expect(load).not.toHaveAttribute("aria-disabled", "true", { timeout: 5000 });
});

test("the keyboard focus ring shows on a focused icon button", async ({ page }) => {
  await open(page, "light", "en");
  const counter = page.getByRole("button", { name: "Count presses" });
  await counter.focus();
  // Moving away and back by keyboard puts the page in keyboard modality, which is what the ring needs.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(counter).toBeFocused();
  await expect(counter).toHaveAttribute("data-focus-visible", "true");
});
