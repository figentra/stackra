/**
 * Stackra file contract:
 * Purpose: the form-field route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a failed submit shows each rule's message under its field, marks the field
 *          invalid and reads the message with it, and says so in a polite status line; a keyboard user reaches the
 *          fields in order and submits with Enter; fixing a field clears its message; a valid submit saves the values;
 *          a simulated server rejection shows on the email; reset clears it; the invalid, required and disabled states
 *          are on the states form; and the label sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0182 (test tiers);
 *          ADR 0022 (test placement).
 */
// @covers sta-350:FR-058 sta-350:FR-059 sta-350:SC-007 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/form-field?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Form field", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the form field page in ${scheme}, ${locale}`, async ({ page }) => {
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
  test(`axe finds nothing on the page once every message is showing, in ${scheme}`, async ({
    page,
  }) => {
    await open(page, scheme, "en");
    const live = example(page, "usage");
    await live.getByRole("button", { name: "Save" }).click();
    await expect(live.getByText("Enter your email address.")).toBeVisible();
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

test("a failed submit shows each message, marks the field invalid and reads the message with it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "usage");
  const email = live.getByRole("textbox", { name: /Email/ });
  await expect(live.getByText("Enter your email address.")).toBeHidden();
  await live.getByRole("button", { name: "Save" }).click();
  const message = live.getByText("Enter your email address.");
  await expect(message).toBeVisible();
  await expect(live.getByText("Accept the terms to continue.")).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  expect((await email.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await message.getAttribute("id"),
  );
  await expect(live.getByTestId("status")).toHaveText("Not saved: 2 fields need attention.");
});

test("the status line is polite live text, so a failed submit is announced", async ({ page }) => {
  await open(page, "light", "en");
  await expect(example(page, "usage").getByTestId("status")).toHaveAttribute("aria-live", "polite");
});

test("a keyboard user fills the form in order and submits with Enter", async ({ page }) => {
  await open(page, "light", "en");
  const live = example(page, "usage");
  const email = live.getByRole("textbox", { name: /Email/ });
  await email.focus();
  await page.keyboard.type("ada@example.com");
  await page.keyboard.press("Tab");
  await expect(live.getByRole("radio", { name: "Free" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(live.getByRole("radio", { name: "Team" })).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("checkbox", { name: /I accept the terms/ })).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(live.getByRole("button", { name: "Save" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(live.getByTestId("status")).toHaveText("Saved ada@example.com on the Team plan.");
});

test("fixing a field clears its message", async ({ page }) => {
  await open(page, "light", "en");
  const live = example(page, "usage");
  const email = live.getByRole("textbox", { name: /Email/ });
  await live.getByRole("button", { name: "Save" }).click();
  await expect(live.getByText("Enter your email address.")).toBeVisible();
  await email.focus();
  await page.keyboard.type("ada");
  await expect(live.getByText("Enter an address such as name@example.com.")).toBeVisible();
  await page.keyboard.type("@example.com");
  await expect(live.getByText("Enter an address such as name@example.com.")).toBeHidden();
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  // Space on the focused checkbox: HeroUI's hidden input is overlapped by its drawn control, so a pointer `check()` is refused.
  const terms = live.getByRole("checkbox", { name: /I accept the terms/ });
  await terms.focus();
  await page.keyboard.press("Space");
  await expect(terms).toBeChecked();
  await expect(live.getByText("Accept the terms to continue.")).toBeHidden();
});

test("a server rejection shows on the email and reset clears it", async ({ page }) => {
  await open(page, "light", "en");
  const live = example(page, "usage");
  await live.getByRole("button", { name: "Simulate a server rejection" }).click();
  await expect(live.getByText("That email address is already in use.")).toBeVisible();
  await expect(live.getByRole("textbox", { name: /Email/ })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await live.getByRole("button", { name: "Reset" }).click();
  await expect(live.getByText("That email address is already in use.")).toBeHidden();
  await expect(live.getByTestId("status")).toHaveText("Nothing saved yet.");
});

test("the states form shows its required, invalid and disabled fields", async ({ page }) => {
  await open(page, "light", "en");
  const states = example(page, "states");
  await expect(states.getByRole("textbox", { name: /Required field/ })).toHaveAttribute(
    "aria-required",
    "true",
  );
  const invalid = states.getByRole("textbox", { name: "Invalid field" });
  await expect(invalid).toHaveAttribute("aria-invalid", "true");
  const message = states.getByText("Enter a name of at least two letters.");
  await expect(message).toBeVisible();
  expect((await invalid.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await message.getAttribute("id"),
  );
  const disabled = states.getByLabel("Disabled field");
  await expect(disabled).toBeDisabled();
  await states.getByRole("textbox", { name: "Valid field", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(disabled).not.toBeFocused();
});

for (const locale of LOCALES)
  test(`the label sits at the reading-start side of the field in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const live = example(page, "usage");
    // The demo speaks the page's language (`assets/lang/<locale>/form_field.json`).
    const email = locale === "en" ? "Email" : "البريد الإلكتروني";
    const input = live.getByRole("textbox", { name: new RegExp(email) });
    const label = live.locator("label").filter({ hasText: email }).first();
    const inputBox = await input.boundingBox();
    const labelBox = await label.boundingBox();
    if (!inputBox || !labelBox) throw new Error("a box is missing");
    if (locale === "en") expect(labelBox.x).toBeCloseTo(inputBox.x, 0);
    else expect(labelBox.x + labelBox.width).toBeCloseTo(inputBox.x + inputBox.width, 0);
  });
