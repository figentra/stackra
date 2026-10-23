/**
 * Stackra file contract:
 * Purpose: the radio-group route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every group is a named `radiogroup` of named radios; the group is one tab
 *          stop and the arrow keys move and choose, reversed for the horizontal group in right-to-left; a disabled
 *          option and a disabled or read-only group do not change; the message describes the invalid group until a
 *          choice is made; the radio sits on the reading-start side; and the readout follows clicks and the buttons.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2; ADR 0060 (right-to-left); ADR 0182
 *          (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-085 sta-350:FR-086 sta-350:FR-087 sta-350:FR-089 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/radio-group?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Radio group" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the radio-group page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every group is a named radiogroup of named radios", async ({ page }) => {
  await open(page, "light", "en");
  const groups = page.locator("article").getByRole("radiogroup");
  const count = await groups.count();
  expect(count).toBe(10);
  for (let index = 0; index < count; index += 1) {
    const group = groups.nth(index);
    await expect(group, `group ${index}`).toHaveAccessibleName(/\S/);
    const radios = group.getByRole("radio");
    expect(await radios.count(), `group ${index}`).toBeGreaterThanOrEqual(2);
    for (let radio = 0; radio < (await radios.count()); radio += 1)
      await expect(radios.nth(radio), `group ${index}, radio ${radio}`).toHaveAccessibleName(/\S/);
  }
});

test("the group is one tab stop, and the arrow keys move and choose", async ({ page }) => {
  await open(page, "light", "en");
  const group = page.getByRole("radiogroup", { name: "Shipping speed" });
  const standard = group.getByRole("radio", { name: "Standard" });
  const express = group.getByRole("radio", { name: "Express" });
  await standard.focus();
  await expect(standard).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(express).toBeFocused();
  await expect(express).toBeChecked();
  await expect(standard).not.toBeChecked();
  await page.keyboard.press("Tab");
  await expect(group.locator(":focus")).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the arrow keys of the horizontal group follow the reading direction in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const group = page.getByRole("radiogroup", { name: "Size" });
    const medium = group.getByRole("radio", { name: "Medium" });
    const large = group.getByRole("radio", { name: "Large" });
    const forward = locale === "en" ? "ArrowRight" : "ArrowLeft";
    const backward = locale === "en" ? "ArrowLeft" : "ArrowRight";
    await expect(medium).toBeChecked();
    await medium.focus();
    await page.keyboard.press(forward);
    await expect(large).toBeChecked();
    await page.keyboard.press(backward);
    await expect(medium).toBeChecked();
  });

test("a disabled option, a disabled group and a read-only group do not change", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(
    page.getByRole("radiogroup", { name: "Payment method" }).getByRole("radio", { name: "Cheque" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("radiogroup", { name: "Payment method" }).getByRole("radio", { name: "Card" }),
  ).toBeEnabled();
  for (const radio of await page
    .getByRole("radiogroup", { name: "Billing cycle" })
    .getByRole("radio")
    .all())
    await expect(radio).toBeDisabled();
  const yearly = page.getByRole("radiogroup", { name: "Your plan" }).getByRole("radio", {
    name: "Yearly",
  });
  const monthly = page.getByRole("radiogroup", { name: "Your plan" }).getByRole("radio", {
    name: "Monthly",
  });
  await yearly.focus();
  await page.keyboard.press("ArrowUp");
  await expect(yearly).toBeChecked();
  await expect(monthly).not.toBeChecked();
});

test("the required group is required, and the invalid group is described until a choice is made", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(page.getByRole("radiogroup", { name: /Account type/ })).toHaveAttribute(
    "aria-required",
    "true",
  );
  const group = page.getByRole("radiogroup", { name: "Delivery window" });
  await expect(group).toHaveAccessibleDescription(
    "Pick the time that suits you. Choose a delivery window to continue.",
  );
  await group.getByText("Monthly", { exact: true }).click();
  await expect(page.getByText("Choose a delivery window to continue.")).toBeHidden();
});

for (const locale of LOCALES)
  test(`the radio sits on the reading-start side of its label in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const radio = page
      .getByRole("radiogroup", { name: "Shipping speed" })
      .getByRole("radio", { name: "Standard" });
    const item = page.locator('[data-slot="radio"]').filter({ has: radio });
    const control = await item.locator('[data-slot="radio-control"]').boundingBox();
    const label = await item.locator('[data-slot="label"]').boundingBox();
    if (!control || !label) throw new Error("a box is missing");
    expect(control.x < label.x, locale).toBe(locale === "en");
  });

test("the readout follows clicks and the buttons that choose from outside", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByRole("status")).toHaveText("Chosen: apple");
  await live.getByText("Plum", { exact: true }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: plum");
  await live.getByRole("button", { name: "Choose pear" }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: pear");
  await expect(live.getByRole("radio", { name: "Pear" })).toBeChecked();
});
