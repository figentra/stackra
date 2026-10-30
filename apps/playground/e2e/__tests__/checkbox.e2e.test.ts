/**
 * Stackra file contract:
 * Purpose: the checkbox route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every checkbox is named by its label or its aria-label; Space toggles a
 *          focused box and a click on its label does too; disabled and read-only boxes do not change; the
 *          indeterminate box is announced as mixed; the control sits on the reading-start side in both directions; a
 *          checked control stands 3:1 from the page; and the select-all parent follows its children.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.4.11, 2.1.1, 4.1.2; ADR 0182 (test tiers); ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-086 sta-350:FR-087 sta-350:FR-089 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { contrastRatio } from "@stackra/tokens";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/checkbox?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Checkbox", locale) }),
  ).toBeVisible();
};

/** A computed colour as `#rrggbb`, composited over `base`: drawn on a canvas, so any CSS colour form reads. */
const paintedOver = (
  locator: Locator,
  property: "color" | "backgroundColor",
  base: string,
  pseudo?: string,
) =>
  locator.evaluate(
    (element, { name, under, part }) => {
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no 2d canvas");
      context.fillStyle = under;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = getComputedStyle(element, part)[name];
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    },
    { name: property, under: base, part: pseudo ?? null },
  );

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the checkbox page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every checkbox has an accessible name", async ({ page }) => {
  await open(page, "light", "en");
  const boxes = page.locator("article").getByRole("checkbox");
  // The demos load lazily: wait for the last example's checkbox before counting.
  await expect(page.locator("section#example-live").getByRole("checkbox").first()).toBeVisible();
  const count = await boxes.count();
  expect(count).toBeGreaterThan(10);
  for (let index = 0; index < count; index += 1) {
    const name = await boxes.nth(index).evaluate((element) => {
      const input = element as HTMLInputElement;
      return (
        input.getAttribute("aria-label") ??
        [...(input.labels ?? [])].map((label) => label.textContent?.trim()).join(" ")
      );
    });
    expect(name, `checkbox ${index}`).toBeTruthy();
  }
});

test("Space toggles a focused checkbox, and a click on its label does too", async ({ page }) => {
  await open(page, "light", "en");
  const box = page.getByRole("checkbox", { name: "Subscribe to the newsletter" });
  await box.focus();
  await expect(box).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(box).toBeChecked();
  await example(page, "usage").getByText("Subscribe to the newsletter", { exact: true }).click();
  await expect(box).not.toBeChecked();
});

test("disabled and read-only checkboxes do not change", async ({ page }) => {
  await open(page, "light", "en");
  const disabled = page.getByRole("checkbox", { name: "Share usage data" });
  await expect(disabled).toBeDisabled();
  const readOnly = page.getByRole("checkbox", { name: "Your plan includes backups" });
  await expect(readOnly).toBeChecked();
  await readOnly.focus();
  await page.keyboard.press("Space");
  await expect(readOnly).toBeChecked();
  await expect(readOnly).toBeFocused();
});

test("the required checkbox is required, and the indeterminate one is mixed", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("checkbox", { name: /I accept the terms/ })).toHaveJSProperty(
    "required",
    true,
  );
  await expect(page.getByRole("checkbox", { name: "Select every invoice" })).toBeChecked({
    indeterminate: true,
  });
});

test("the invalid checkbox is described by its message until it is checked", async ({ page }) => {
  await open(page, "light", "en");
  const box = page.getByRole("checkbox", { name: "I am over eighteen" });
  await expect(box).toHaveAccessibleDescription("Confirm your age to continue.");
  await box.focus();
  await page.keyboard.press("Space");
  await expect(box).not.toHaveAccessibleDescription("Confirm your age to continue.");
});

for (const locale of LOCALES)
  test(`the control sits on the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // The demo speaks the page's locale, so the first sample is found by place, not by its English name.
    const item = example(page, "usage").locator('[data-slot="checkbox"]').first();
    const control = await item.locator('[data-slot="checkbox-control"]').boundingBox();
    const label = await item.locator('[data-slot="label"]').boundingBox();
    if (!control || !label) throw new Error("a box is missing");
    expect(control.x < label.x, locale).toBe(locale === "en");
  });

for (const scheme of SCHEMES)
  test(`a checked control stands 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const pageBackground = await paintedOver(page.locator("body"), "backgroundColor", "#ffffff");
    const control = page
      .locator('[data-slot="checkbox"]')
      .filter({ has: page.getByRole("checkbox", { name: "Remember this device" }) })
      .locator('[data-slot="checkbox-control"]');
    // HeroUI paints the checked fill on the control's `::before`, which scales in over the field background.
    const fill = await paintedOver(control, "backgroundColor", pageBackground, "::before");
    expect(
      contrastRatio(fill, pageBackground),
      `${fill} on ${pageBackground}`,
    ).toBeGreaterThanOrEqual(3);
  });

test("the select-all parent follows its children", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const parent = live.getByRole("checkbox", { name: "Select all toppings" });
  await expect(parent).toBeChecked({ indeterminate: true });
  await expect(live.getByRole("status")).toHaveText("Chosen: Cheese");
  await live.getByText("Select all toppings", { exact: true }).click();
  await expect(parent).toBeChecked();
  await expect(live.getByRole("status")).toHaveText("Chosen: Cheese, Olives, Basil");
  await live.getByText("Olives", { exact: true }).click();
  await expect(parent).toBeChecked({ indeterminate: true });
  await live.getByRole("button", { name: "Clear" }).click();
  await expect(parent).not.toBeChecked();
  await expect(live.getByRole("status")).toHaveText("Chosen: none");
});
