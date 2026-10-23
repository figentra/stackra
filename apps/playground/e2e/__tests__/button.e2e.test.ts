/**
 * Stackra file contract:
 * Purpose: the button route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a press counts and a disabled button does not; a loading button keeps
 *          focus, refuses presses and keeps its name; the start icon sits at the inline start in both directions; and
 *          the keyboard focus ring shows.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:FR-027 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/button?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Button" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the button page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("a press counts, and the disabled button does not", async ({ page }) => {
  await open(page, "light", "en");
  const count = page.getByTestId("press-count");
  await expect(count).toHaveText("Pressed 0 times.");
  await page.getByRole("button", { name: "Count", exact: true }).click();
  await expect(count).toHaveText("Pressed 1 time.");
  const disabled = page.getByRole("button", { name: "Count (disabled)" });
  await expect(disabled).toBeDisabled();
  await disabled.click({ force: true });
  await expect(count).toHaveText("Pressed 1 time.");
});

test("a loading button keeps focus, refuses presses and keeps its name", async ({ page }) => {
  await open(page, "light", "en");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(save).toHaveAttribute("aria-disabled", "true");
  await expect(save).toHaveAttribute("data-pending", "true");
  await expect(save).toBeFocused();
  await expect(page.getByTestId("save-state")).toHaveText("Saving…");
  // A press while loading is refused: the state stays and focus stays.
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("save-state")).toHaveText("Saving…");
  await expect(save).toBeFocused();
  await expect(save).toHaveAccessibleName("Save");
  await expect(page.getByTestId("save-state")).toHaveText("Idle.", { timeout: 5000 });
  await expect(save).not.toHaveAttribute("aria-disabled", "true");
  await expect(save).toBeFocused();
});

for (const locale of LOCALES)
  test(`the start icon sits at the inline start in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const button = page.getByRole("button", { name: "Add", exact: true });
    const [icon, box] = await Promise.all([
      button.locator("svg").boundingBox(),
      button.boundingBox(),
    ]);
    if (!icon || !box) throw new Error("the button has no box");
    const iconIsLeft = icon.x + icon.width / 2 < box.x + box.width / 2;
    expect(iconIsLeft).toBe(locale === "en");
  });

test("the keyboard focus ring shows on a focused button", async ({ page }) => {
  await open(page, "light", "en");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await save.focus();
  // Moving away and back by keyboard puts the page in keyboard modality, which is what the ring needs.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(save).toBeFocused();
  await expect(save).toHaveAttribute("data-focus-visible", "true");
});
