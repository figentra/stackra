/**
 * Stackra file contract:
 * Purpose: the search field route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each field is named by its label or its aria-label and the description and
 *          the error are tied to it; typing is keyboard-only, Escape and the clear button empty the field; the live
 *          list filters while the field is busy and Enter is reported; a disabled field cannot be focused and a
 *          read-only one cannot be typed in; and the search icon sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
// @covers sta-350:FR-074 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/search-field?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Search field", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the search field page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each field is named, and the description and the error are tied to its input", async ({
  page,
}) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
  await expect(basics.getByRole("searchbox", { name: "Search products" })).toBeVisible();
  await expect(basics.getByRole("searchbox", { name: "Search the help centre" })).toBeVisible();
  const described = basics.getByRole("searchbox", { name: "Search orders" });
  await expect(described).toHaveAccessibleDescription("Search by order number, customer or date.");

  const states = page.getByRole("region", { name: "States" });
  const invalid = states.getByRole("searchbox", { name: "Invalid" });
  await expect(invalid).toHaveAttribute("aria-invalid", "true");
  await expect(invalid).toHaveAccessibleDescription("Enter at least three characters.");
});

test("typing and Escape work from the keyboard alone, and the clear button empties the field", async ({
  page,
}) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
  const input = basics.getByRole("searchbox", { name: "Search products" });
  await input.focus();
  await expect(input).toBeFocused();
  await page.keyboard.type("mug");
  await expect(input).toHaveValue("mug");
  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("");

  await page.keyboard.type("mug");
  await basics.getByRole("button", { name: "Clear search" }).first().click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
});

test("the live list filters while the field is busy, then reports Enter and the clear button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const input = live.getByRole("searchbox", { name: "Find a product" });
  await expect(live.getByRole("listitem")).toHaveCount(8);

  await input.fill("lamp");
  await expect(input).toHaveAttribute("aria-busy", "true");
  await expect(live.getByRole("listitem")).toHaveCount(2);
  await expect(input).not.toHaveAttribute("aria-busy", "true");
  await expect(live.getByRole("status")).toHaveText("2 products found.");

  await input.press("Enter");
  await expect(live.getByTestId("search-message")).toHaveText("Submitted: lamp");

  await live.getByRole("button", { name: "Clear the product search" }).click();
  await expect(input).toHaveValue("");
  await expect(live.getByTestId("search-message")).toHaveText("Cleared the search.");
  await expect(live.getByRole("listitem")).toHaveCount(8);
});

test("a disabled field cannot be focused, and a read-only one cannot be typed in", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("searchbox", { name: "Disabled" })).toBeDisabled();

  const readOnly = states.getByRole("searchbox", { name: "Read-only" });
  await readOnly.focus();
  await expect(readOnly).toBeFocused();
  await page.keyboard.type("x");
  await expect(readOnly).toHaveValue("Blue shirt");
});

for (const locale of LOCALES)
  test(`the search icon sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By id and place: the words speak the page's locale.
    const group = example(page, "usage").locator('[data-slot="search-field-group"]').first();
    const groupBox = await group.boundingBox();
    const iconBox = await group.locator('[data-slot="search-field-search-icon"]').boundingBox();
    if (!groupBox || !iconBox) throw new Error("a box is missing");
    const iconMiddle = iconBox.x + iconBox.width / 2;
    const groupMiddle = groupBox.x + groupBox.width / 2;
    expect(iconMiddle < groupMiddle, locale).toBe(locale === "en");
  });
