/**
 * Stackra file contract:
 * Purpose: the combo box route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each field is named by its label or its aria-label and the description is
 *          tied to it; typing narrows the list and a choice is made from the keyboard alone; several choices show as
 *          tags that can be removed and added to; a message says so when nothing matches; a disabled field cannot be
 *          focused and a read-only one cannot be typed in; the live field shows a busy list while the pretend server
 *          answers, loads more at the end of the list and reports the chosen key; and the trigger sits at the
 *          reading-end side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
// @covers sta-350:FR-081 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/combo-box?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Combo box" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the combo box page in ${scheme}, ${locale}`, async ({ page }) => {
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
  const basics = page.getByRole("region", { name: "Basics" });
  await expect(basics.getByRole("combobox", { name: /Country/ })).toBeVisible();
  await expect(basics.getByRole("combobox", { name: /Search countries/ })).toBeVisible();
  await expect(basics.getByRole("combobox", { name: /Ship from/ })).toHaveAccessibleDescription(
    "The warehouse the order leaves from.",
  );

  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("combobox", { name: /Invalid/ })).toHaveAccessibleDescription(
    "Choose a country before you continue.",
  );
});

test("typing narrows the list, and a choice is made from the keyboard alone", async ({ page }) => {
  await open(page, "light", "en");
  const input = page
    .getByRole("region", { name: "Basics" })
    .getByRole("combobox", { name: /Country/ });
  await input.focus();
  await page.keyboard.type("aus");
  await expect(page.getByRole("option")).toHaveText([/Australia/, /Austria/]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toHaveValue("Australia");
  await expect(input).toBeFocused();
});

test("Escape closes the list and keeps focus in the field", async ({ page }) => {
  await open(page, "light", "en");
  const input = page
    .getByRole("region", { name: "Basics" })
    .getByRole("combobox", { name: /Country/ });
  await input.focus();
  await page.keyboard.type("fra");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toBeFocused();
});

test("several choices are tags that can be removed and added to", async ({ page }) => {
  await open(page, "light", "en");
  const modes = page.getByRole("region", { name: "One or several" });
  // CSS, not `getByRole`: while the list is open React Aria hides the rest of the page from the accessibility tree, and
  // after a pick in several-choice mode the list may still be open, so a role query would find no grid at all.
  const tags = modes.locator('[role="grid"][aria-label="Several countries"] [data-slot="tag"]');
  await expect(tags).toHaveCount(3);

  await modes.getByRole("button", { name: /Remove.*Egypt/ }).click();
  await expect(tags).toHaveCount(2);

  const input = modes.getByRole("combobox", { name: /Several countries/ });
  await input.focus();
  await page.keyboard.type("fra");
  await page.getByRole("option", { name: "France" }).click();
  await expect(tags).toHaveCount(3);
  await expect(tags.last()).toContainText("France");
});

test("a field with a no-match message says so, and a list without one stays closed", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  await states.getByRole("combobox", { name: /With a no-match message/ }).focus();
  await page.keyboard.type("zzz");
  await expect(page.getByText("No country found.")).toBeVisible();

  await page.keyboard.press("Escape");
  const plain = states.getByRole("combobox", { name: /Required/ });
  await plain.focus();
  await page.keyboard.type("zzz");
  // A count, not `toBeHidden`: the first field's list may still be leaving while the second is read, and a locator
  // that resolves to two elements is an error to `toBeHidden`, where a count simply retries.
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("a disabled field cannot be focused, and a read-only one cannot be typed in", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("combobox", { name: /Disabled/ })).toBeDisabled();

  const readOnly = states.getByRole("combobox", { name: /Read-only/ });
  await readOnly.focus();
  await expect(readOnly).toBeFocused();
  await page.keyboard.type("x");
  await expect(readOnly).toHaveValue("Australia");
});

test("the live field is busy while the server answers, loads more at the end and reports the key", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const input = live.getByRole("combobox", { name: /Find a country/ });
  await expect(live.getByTestId("combo-box-shown")).toHaveText("Showing 8 of 24 countries.");

  await input.focus();
  await page.keyboard.type("an");
  await expect(page.getByRole("status", { name: "Loading countries" })).toBeVisible();
  await expect(live.getByTestId("combo-box-shown")).toHaveText("Showing 7 of 7 countries.");
  await expect(page.getByRole("status", { name: "Loading countries" })).toBeHidden();

  await input.fill("");
  // The end of the list is what asks for more, and a page of eight does not fill the popover, so the next page comes
  // at once and the first one is never settled; scroll to the bottom on every poll for a taller list.
  const shown = live.getByTestId("combo-box-shown");
  await expect
    .poll(async () => {
      await page.locator('[data-slot="combo-box-popover"]').evaluate((popover) => {
        popover.scrollTop = popover.scrollHeight;
      });
      return shown.textContent();
    })
    .toBe("Showing 24 of 24 countries.");

  await page.getByRole("option", { name: "Austria" }).click();
  await expect(live.getByTestId("combo-box-chosen")).toHaveText("Chosen key: at");
});

for (const locale of LOCALES)
  test(`the trigger sits at the reading-end side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const group = page
      .getByRole("region", { name: "Basics" })
      .locator('[data-slot="combo-box-input-group"]')
      .first();
    const groupBox = await group.boundingBox();
    const trigger = await group.locator('[data-slot="combo-box-trigger"]').boundingBox();
    if (!groupBox || !trigger) throw new Error("a box is missing");
    const triggerMiddle = trigger.x + trigger.width / 2;
    const groupMiddle = groupBox.x + groupBox.width / 2;
    expect(triggerMiddle > groupMiddle, locale).toBe(locale === "en");
  });
