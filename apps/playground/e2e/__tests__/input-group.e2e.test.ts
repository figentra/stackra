/**
 * Stackra file contract:
 * Purpose: the input-group route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; the prefix sits at the reading-start side of the input and the suffix at the
 *          reading-end side in both directions, all inside one border; a click on a text affix focuses the input; the
 *          password button reveals and hides the value and keeps keyboard focus on itself; an invalid group is marked
 *          and read with its error; a disabled group leaves the tab order; and the live preview follows the slug.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-069 sta-350:FR-070 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/input-group?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Input group" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the input group page in ${scheme}, ${locale}`, async ({ page }) => {
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
  test(`the prefix and the suffix sit at the reading sides of the input in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const group = page.locator('[data-slot="input-group"]').filter({ hasText: "USD" }).first();
    const prefix = await group.locator('[data-slot="input-group-prefix"]').boundingBox();
    const input = await group.locator("input").boundingBox();
    const suffix = await group.locator('[data-slot="input-group-suffix"]').boundingBox();
    const border = await group.boundingBox();
    if (!prefix || !input || !suffix || !border) throw new Error("a box is missing");
    // The prefix is on the reading-start side: the left in English, the right in Arabic; the suffix is the other.
    const left = locale === "en" ? prefix : suffix;
    const right = locale === "en" ? suffix : prefix;
    expect(
      left.x + left.width,
      `${locale}: the left affix ends before the input`,
    ).toBeLessThanOrEqual(input.x + 1);
    expect(right.x, `${locale}: the right affix begins after the input`).toBeGreaterThanOrEqual(
      input.x + input.width - 1,
    );
    for (const box of [prefix, input, suffix]) {
      expect(box.x).toBeGreaterThanOrEqual(border.x);
      expect(box.x + box.width).toBeLessThanOrEqual(border.x + border.width + 1);
    }
  });

test("a click on a text affix focuses the input", async ({ page }) => {
  await open(page, "light", "en");
  const group = page.locator('[data-slot="input-group"]').filter({ hasText: "https://" });
  await group.locator('[data-slot="input-group-prefix"]').click();
  await expect(group.locator("input")).toBeFocused();
});

test("the password button reveals and hides the value and keeps keyboard focus on itself", async ({
  page,
}) => {
  await open(page, "light", "en");
  const elements = page.getByRole("region", { name: "Element affixes" });
  const input = elements.getByLabel("Password", { exact: true });
  await input.fill("secret");
  await expect(input).toHaveAttribute("type", "password");
  const show = elements.getByRole("button", { name: "Show password" });
  await show.focus();
  await page.keyboard.press("Enter");
  await expect(input).toHaveAttribute("type", "text");
  const hide = elements.getByRole("button", { name: "Hide password" });
  await expect(hide).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toHaveAttribute("type", "password");
  await expect(input).toHaveValue("secret");
});

test("an invalid group is marked invalid and read with its error", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "Invalid group" });
  await expect(input).toHaveAttribute("aria-invalid", "true");
  const error = page.getByText("Enter a weight in kilograms.");
  await expect(error).toBeVisible();
  expect((await input.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await error.getAttribute("id"),
  );
  await expect(input.locator("xpath=ancestor::*[@data-slot='input-group']")).toHaveAttribute(
    "data-invalid",
    "true",
  );
});

test("a disabled group leaves the tab order and a read-only one refuses text", async ({ page }) => {
  await open(page, "light", "en");
  const disabled = page.getByLabel("Disabled group");
  await expect(disabled).toBeDisabled();
  const readOnly = page.getByRole("textbox", { name: "Read-only group" });
  await readOnly.focus();
  await page.keyboard.type("1");
  await expect(readOnly).toHaveValue("70");
  await page.keyboard.press("Tab");
  await expect(disabled).not.toBeFocused();
});

test("the live preview follows the slug", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("preview")).toHaveText("https://figentra.com/summer-sale");
  await live.getByRole("textbox", { name: "Page address" }).fill("spring");
  await expect(live.getByTestId("preview")).toHaveText("https://figentra.com/spring");
});
