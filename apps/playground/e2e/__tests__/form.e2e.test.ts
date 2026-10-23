/**
 * Stackra file contract:
 * Purpose: the form route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each control's accessible name and description come from its Label and
 *          Description; a required label draws its asterisk and an invalid one the error colour; a disabled control
 *          leaves the tab order; and the live form refuses a bad email with focus on the field and the error read out
 *          with it, submits on Enter alone with the switch off, on Control plus Enter only with it on, and still adds a
 *          line in the text area with Enter.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0055 (forms); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1 and 3.3.1.
 */
// @covers sta-350:FR-090 sta-350:FR-091 sta-350:FR-092 sta-350:FR-093 sta-350:FR-094 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/form?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Form" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the form page in ${scheme}, ${locale}`, async ({ page }) => {
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

for (const locale of LOCALES)
  test(`a control is named by its label and described by its description in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const field = page.getByRole("textbox", { name: "Display name" });
    await expect(field).toHaveAccessibleDescription("Shown on invoices. You can change it later.");
    const invalid = page.getByRole("textbox", { name: "Invalid field" });
    await expect(invalid).toHaveAccessibleDescription("Enter a value before you continue.");
    await expect(invalid).toHaveAttribute("aria-invalid", "true");
  });

test("a required label draws its asterisk and an invalid one the error colour", async ({
  page,
}) => {
  await open(page, "light", "en");
  const labels = page.getByRole("region", { name: "Label" });
  const asterisk = (text: string) =>
    labels
      .getByText(text, { exact: true })
      .evaluate((element) => getComputedStyle(element, "::after").content);
  expect(await asterisk("Required label")).toContain("*");
  expect(await asterisk("Default label")).not.toContain("*");
  const colour = (text: string) =>
    labels.getByText(text, { exact: true }).evaluate((element) => getComputedStyle(element).color);
  expect(await colour("Invalid label")).not.toBe(await colour("Default label"));
});

test("a disabled control leaves the tab order and its label stays on the page", async ({
  page,
}) => {
  await open(page, "light", "en");
  const labels = page.getByRole("region", { name: "Label" });
  await expect(labels.getByRole("textbox", { name: "Disabled label" })).toBeDisabled();
  await labels.getByRole("textbox", { name: "Invalid label" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Display name" })).toBeFocused();
});

test("a bad email is refused: focus moves to the field and the error is read out with it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("nobody");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription(
    /We reply to this address\..*Enter an email address/,
  );
  await expect(page.getByTestId("submit-state")).toHaveText("Not sent: the email is not valid.");
  await email.fill("ada@example.com");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("submit-state")).toHaveText("Sent 1 time, to ada@example.com.");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
});

test("with the switch on, Enter alone does not send and Control plus Enter does", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(
    page.getByRole("switch", { name: "Submit with Cmd or Ctrl plus Enter" }),
  ).toBeChecked();
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("ada@example.com");
  await email.press("Enter");
  await expect(page.getByTestId("submit-state")).toHaveText("Nothing sent yet.");
  await email.press("Control+Enter");
  await expect(page.getByTestId("submit-state")).toHaveText("Sent 1 time, to ada@example.com.");
});

test("with the switch off, Enter alone sends", async ({ page }) => {
  await open(page, "light", "en");
  await page.getByRole("switch", { name: "Submit with Cmd or Ctrl plus Enter" }).uncheck();
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("ada@example.com");
  await email.press("Enter");
  await expect(page.getByTestId("submit-state")).toHaveText("Sent 1 time, to ada@example.com.");
});

test("Enter still adds a line in the text area and presses the focused button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.fill("one");
  await notes.press("Enter");
  await notes.pressSequentially("two");
  await expect(notes).toHaveValue("one\ntwo");
  await expect(page.getByTestId("submit-state")).toHaveText("Nothing sent yet.");
  // A keyboard user reaches the button and presses it with Enter: the switch must not take that key.
  await page.getByRole("textbox", { name: "Email" }).fill("ada@example.com");
  await page.getByRole("button", { name: "Send" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("submit-state")).toHaveText("Sent 1 time, to ada@example.com.");
});
