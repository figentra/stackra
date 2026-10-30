/**
 * Stackra file contract:
 * Purpose: the text-field route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; the input is named by its label and described by its description; an
 *          invalid field is marked and read with its error; typing reaches the live field, which shows its error and
 *          clears it; a click on the label focuses the input; a disabled field leaves the tab order and a read-only
 *          one keeps focus but refuses text; the focus shows a ring; the label sits at the reading-start side in both
 *          directions; and a password field masks what is typed.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-063 sta-350:FR-064 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/text-field?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Text field", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the text field page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("the input is named by its label and described by its description", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "With a description" });
  await expect(input).toBeVisible();
  const describedBy = await input.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  const description = page.getByText("As it appears on your invoices.");
  const id = await description.getAttribute("id");
  expect(describedBy?.split(" ")).toContain(id);
});

test("an invalid field is marked invalid and read with its error", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "Invalid field" });
  await expect(input).toHaveAttribute("aria-invalid", "true");
  const error = page.getByText("Enter a name of at least two letters.");
  await expect(error).toBeVisible();
  expect((await input.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await error.getAttribute("id"),
  );
});

test("typing reaches the live field, which shows its error and clears it", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const input = live.getByRole("textbox", { name: "Work email" });
  const error = live.getByText("Enter an email address with an at sign.");
  await expect(error).toBeHidden();
  await input.focus();
  await page.keyboard.type("ada");
  await expect(error).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(live.getByTestId("typed")).toHaveText("You typed 3 characters: ada");
  await page.keyboard.type("@example.com");
  await expect(error).toBeHidden();
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(live.getByTestId("typed")).toHaveText("You typed 15 characters: ada@example.com");
});

test("a click on the label focuses the input", async ({ page }) => {
  await open(page, "light", "en");
  await page.getByText("Label only", { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Label only" })).toBeFocused();
});

test("a disabled field leaves the tab order and a read-only one keeps focus but refuses text", async ({
  page,
}) => {
  await open(page, "light", "en");
  const disabled = page.getByLabel("Disabled field");
  await expect(disabled).toBeDisabled();
  const readOnly = page.getByRole("textbox", { name: "Read-only field" });
  await expect(readOnly).toHaveJSProperty("readOnly", true);
  await readOnly.focus();
  await expect(readOnly).toBeFocused();
  await page.keyboard.type("more");
  await expect(readOnly).toHaveValue("Kept value");
  await page.keyboard.press("Tab");
  await expect(disabled).not.toBeFocused();
});

test("the focused input shows a ring", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "Label only" });
  await input.focus();
  const ring = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      style.boxShadow !== "none" ||
      (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0)
    );
  });
  expect(ring).toBe(true);
});

for (const locale of LOCALES)
  test(`the label sits at the reading-start side of the input in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By place: the words speak the page's locale; the usage's first field and its label.
    const input = example(page, "usage").getByRole("textbox").first();
    const label = example(page, "usage").locator('[data-slot="label"]').first();
    const inputBox = await input.boundingBox();
    const labelBox = await label.boundingBox();
    if (!inputBox || !labelBox) throw new Error("a box is missing");
    if (locale === "en") expect(labelBox.x).toBeCloseTo(inputBox.x, 0);
    else expect(labelBox.x + labelBox.width).toBeCloseTo(inputBox.x + inputBox.width, 0);
  });

test("a password field masks what is typed and the kinds set their input type", async ({
  page,
}) => {
  await open(page, "light", "en");
  const kinds = page.getByRole("region", { name: "Kinds of text" });
  const password = kinds.getByLabel("Kind: password");
  await password.focus();
  await page.keyboard.type("secret");
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveValue("secret");
  for (const kind of ["text", "email", "password", "tel", "url"])
    await expect(kinds.getByLabel(`Kind: ${kind}`), kind).toHaveAttribute("type", kind);
});
