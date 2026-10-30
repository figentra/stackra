/**
 * Stackra file contract:
 * Purpose: the text-area route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; the area is named by its label and described by its description; an invalid
 *          area is marked and read with its error; the Enter key adds a line; a six-line area is taller than a
 *          two-line one; the live area counts its characters and shows its error past the limit; a disabled area leaves
 *          the tab order and a read-only one keeps focus but refuses text; and the label sits at the reading-start side
 *          in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-066 sta-350:FR-067 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/text-area?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Text area", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the text area page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("the area is named by its label and described by its description", async ({ page }) => {
  await open(page, "light", "en");
  const area = page.getByRole("textbox", { name: "With a description" });
  await expect(area).toHaveJSProperty("tagName", "TEXTAREA");
  const description = page.getByText("Include the order number if you have one.");
  expect((await area.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await description.getAttribute("id"),
  );
});

test("an invalid area is marked invalid and read with its error", async ({ page }) => {
  await open(page, "light", "en");
  const area = page.getByRole("textbox", { name: "Invalid area" });
  await expect(area).toHaveAttribute("aria-invalid", "true");
  const error = page.getByText("Write at least ten characters.");
  await expect(error).toBeVisible();
  expect((await area.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await error.getAttribute("id"),
  );
});

test("the Enter key adds a line instead of leaving the area", async ({ page }) => {
  await open(page, "light", "en");
  const area = page.getByRole("textbox", { name: "Label only" });
  await area.focus();
  await page.keyboard.type("first");
  await page.keyboard.press("Enter");
  await page.keyboard.type("second");
  await expect(area).toHaveValue("first\nsecond");
  await expect(area).toBeFocused();
});

test("a six-line area is taller than a two-line one", async ({ page }) => {
  await open(page, "light", "en");
  const lines = page.getByRole("region", { name: "Lines" });
  const two = await lines.getByRole("textbox", { name: "Two lines" }).boundingBox();
  const six = await lines.getByRole("textbox", { name: "Six lines" }).boundingBox();
  if (!two || !six) throw new Error("a box is missing");
  expect(six.height).toBeGreaterThan(two.height * 1.5);
});

test("the live area counts its characters and shows its error past the limit", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const area = live.getByRole("textbox", { name: "Message" });
  const error = live.getByText("The message is over 40 characters.");
  await expect(live.getByTestId("count")).toHaveText("0 of 40 characters");
  await area.fill("x".repeat(40));
  await expect(live.getByTestId("count")).toHaveText("40 of 40 characters");
  await expect(error).toBeHidden();
  await area.focus();
  await page.keyboard.type("y");
  await expect(live.getByTestId("count")).toHaveText("41 of 40 characters");
  await expect(error).toBeVisible();
  await expect(area).toHaveAttribute("aria-invalid", "true");
});

test("a disabled area leaves the tab order and a read-only one keeps focus but refuses text", async ({
  page,
}) => {
  await open(page, "light", "en");
  const disabled = page.getByLabel("Disabled area");
  await expect(disabled).toBeDisabled();
  const readOnly = page.getByRole("textbox", { name: "Read-only area" });
  await expect(readOnly).toHaveJSProperty("readOnly", true);
  await readOnly.focus();
  await page.keyboard.type("more");
  await expect(readOnly).toHaveValue("Kept value");
  await page.keyboard.press("Tab");
  await expect(disabled).not.toBeFocused();
});

for (const locale of LOCALES)
  test(`the label sits at the reading-start side of the area in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By place: the words speak the page's locale; the usage's first field and its label.
    const area = example(page, "usage").getByRole("textbox").first();
    const label = example(page, "usage").locator('[data-slot="label"]').first();
    const areaBox = await area.boundingBox();
    const labelBox = await label.boundingBox();
    if (!areaBox || !labelBox) throw new Error("a box is missing");
    if (locale === "en") expect(labelBox.x).toBeCloseTo(areaBox.x, 0);
    else expect(labelBox.x + labelBox.width).toBeCloseTo(areaBox.x + areaBox.width, 0);
  });
