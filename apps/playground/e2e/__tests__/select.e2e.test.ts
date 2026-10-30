/**
 * Stackra file contract:
 * Purpose: the select route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each field is named by its label or its aria-label and the description is
 *          tied to it; the list opens and a choice is made from the keyboard alone (typeahead, Enter, Escape) with focus
 *          returning to the trigger; a disabled item is refused, a disabled field cannot be focused and a read-only one
 *          keeps focus but never opens; the chosen key is reported and cleared from outside; the list is as wide as its
 *          trigger; and the chevron sits at the reading-end side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
// @covers sta-350:FR-081 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/select?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Select", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the select page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each field is named, and the description and the error are tied to its trigger", async ({
  page,
}) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
  await expect(basics.getByRole("button", { name: /Order status/ })).toBeVisible();
  await expect(basics.getByRole("button", { name: /Sort orders by/ })).toBeVisible();
  await expect(basics.getByRole("button", { name: /Shipping method/ })).toHaveAccessibleDescription(
    "How the order leaves the warehouse.",
  );

  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("button", { name: /Invalid/ })).toHaveAccessibleDescription(
    "Choose a status before you continue.",
  );
});

test("a choice is made from the keyboard alone, and focus returns to the trigger", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const trigger = live.getByRole("button", { name: /Status of the shipment/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.type("Pa");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Paid");
  await expect(live.getByTestId("select-chosen")).toHaveText("Chosen key: paid");
});

test("Escape closes the list without changing the choice", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const trigger = live.getByRole("button", { name: /Status of the shipment/ });
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(live.getByTestId("select-chosen")).toHaveText("Chosen key: none");
});

test("the chosen key is reported, and cleared from outside", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const trigger = live.getByRole("button", { name: /Status of the shipment/ });
  await trigger.click();
  await page.getByRole("option", { name: "Sent" }).click();
  await expect(live.getByTestId("select-chosen")).toHaveText("Chosen key: sent");
  await expect(trigger).toContainText("Sent");
  await live.getByRole("button", { name: "Clear the choice" }).click();
  await expect(live.getByTestId("select-chosen")).toHaveText("Chosen key: none");
  await expect(trigger).toContainText("Choose a status");
});

test("a disabled item is refused, and an item shows its description", async ({ page }) => {
  await open(page, "light", "en");
  await page.getByRole("region", { name: "Items" }).getByRole("button", { name: /Plan/ }).click();
  await expect(page.getByRole("option", { name: /Free/ })).toContainText(
    "For one person, up to three projects.",
  );
  await expect(page.getByRole("option", { name: /Legacy/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("a disabled field cannot be focused, and a read-only one keeps focus but never opens", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("button", { name: /Disabled/ })).toBeDisabled();

  const readOnly = states.getByRole("button", { name: /Read-only/ });
  await readOnly.focus();
  await expect(readOnly).toBeFocused();
  await page.keyboard.press("Enter");
  await readOnly.click();
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(readOnly).toContainText("Sent");
});

test("the list is at least as wide as its trigger", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = page
    .getByRole("region", { name: "Usage" })
    .getByRole("button", { name: /Order status/ });
  await trigger.click();
  const triggerBox = await trigger.boundingBox();
  if (!triggerBox) throw new Error("a box is missing");
  // Polled: the popover scales in as it opens, so its box is narrower than its final width for a moment.
  await expect
    .poll(async () => (await page.getByRole("listbox").boundingBox())?.width ?? 0)
    .toBeGreaterThanOrEqual(triggerBox.width - 1);
});

for (const locale of LOCALES)
  test(`the chevron sits at the reading-end side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By id and place: the words speak the page's locale.
    const trigger = example(page, "usage").locator('[data-slot="select-trigger"]').first();
    const triggerBox = await trigger.boundingBox();
    const chevron = await trigger.locator('[data-slot="select-default-indicator"]').boundingBox();
    if (!triggerBox || !chevron) throw new Error("a box is missing");
    const chevronMiddle = chevron.x + chevron.width / 2;
    const triggerMiddle = triggerBox.x + triggerBox.width / 2;
    expect(chevronMiddle > triggerMiddle, locale).toBe(locale === "en");
  });
