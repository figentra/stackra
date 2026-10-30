/**
 * Stackra file contract:
 * Purpose: the form-section route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, also with the billing section disabled; each section is a group named by
 *          its title, and a described one is read with its description; a keyboard user reaches the fields of a section
 *          in order and toggles the disabling switch with Space; a disabled section takes every field inside it out of
 *          the tab order; and the title sits at the reading-start side of the section in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0182 (test tiers);
 *          ADR 0022 (test placement).
 */
// @covers sta-350:FR-060 sta-350:SC-007 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/form-section?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Form section", locale) }),
  ).toBeVisible();
};

/** Turns the billing switch on from the keyboard: HeroUI's hidden input is overlapped by its drawn control, so a pointer click on the input is refused. */
const disableBilling = async (page: Page) => {
  await page.getByRole("switch", { name: "Disable the billing section" }).focus();
  await page.keyboard.press("Space");
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the form section page in ${scheme}, ${locale}`, async ({ page }) => {
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

for (const scheme of SCHEMES)
  test(`axe finds nothing with the billing section disabled, in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    await disableBilling(page);
    const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(
      violations.map((finding) => finding.id),
      "axe violations",
    ).toEqual([]);
    expect(
      incomplete.map((finding) => finding.id),
      "axe checks left for review",
    ).toEqual([]);
  });

test("each section is a group named by its title, and a described one is read with its description", async ({
  page,
}) => {
  await open(page, "light", "en");
  const parts = page.getByRole("region", { name: "Usage" });
  await expect(parts.getByRole("group", { name: "Title only" })).toBeVisible();
  const described = parts.getByRole("group", { name: "With a description" });
  await expect(described).toBeVisible();
  const description = parts.getByText("Where we send invoices and how we address you.");
  expect(await described.getAttribute("aria-describedby")).toBe(
    await description.getAttribute("id"),
  );
  await expect(
    parts.getByRole("group", { name: "Several fields" }).getByRole("textbox"),
  ).toHaveCount(2);
});

test("a keyboard user reaches a section's fields in order and toggles the switch with Space", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await live.getByRole("textbox", { name: "Display name" }).focus();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("textbox", { name: "Billing address" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("textbox", { name: "VAT number" })).toBeFocused();
  await page.keyboard.press("Tab");
  const toggle = live.getByRole("switch", { name: "Disable the billing section" });
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  // `toBeDisabled` knows controls, not a fieldset, so the native `disabled` property is read instead.
  await expect(live.getByRole("group", { name: "Billing" })).toHaveJSProperty("disabled", true);
});

test("a disabled section takes every field inside it out of the tab order", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await disableBilling(page);
  await expect(live.getByRole("textbox", { name: "Billing address" })).toBeDisabled();
  await expect(live.getByRole("textbox", { name: "VAT number" })).toBeDisabled();
  await live.getByRole("textbox", { name: "Display name" }).focus();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("switch", { name: "Disable the billing section" })).toBeFocused();
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("textbox", { name: "Company" })).toBeDisabled();
});

for (const locale of LOCALES)
  test(`the title sits at the reading-start side of the section in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By place: the section's title speaks the page's locale; With a description is the usage's second group.
    const group = example(page, "usage").getByRole("group").nth(1);
    const title = group.locator("legend");
    const groupBox = await group.boundingBox();
    const titleBox = await title.boundingBox();
    if (!groupBox || !titleBox) throw new Error("a box is missing");
    if (locale === "en") expect(titleBox.x).toBeCloseTo(groupBox.x, 0);
    else expect(titleBox.x + titleBox.width).toBeCloseTo(groupBox.x + groupBox.width, 0);
  });
