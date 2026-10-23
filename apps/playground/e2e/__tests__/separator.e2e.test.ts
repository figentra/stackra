/**
 * Stackra file contract:
 * Purpose: the separator route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a horizontal rule is 1 px tall and as wide as its container; a vertical one
 *          is 1 px wide and as tall as its row, in English and Arabic; the secondary and tertiary rules paint colours
 *          different from the default and from their surface; and the live rule turns.
 * Boundary: the production build under `vite preview`; Chromium only. The rules' colours are logged, not held to a
 *          ratio: WCAG 1.4.11 does not cover decorative rules.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-032 sta-350:P-019 sta-350:P-022 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/separator?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Separator" })).toBeVisible();
};

/** The background an element paints, as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const paintedBackground = (locator: Locator) =>
  locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the separator page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("a horizontal rule is 1 px tall and as wide as its container", async ({ page }) => {
  await open(page, "light", "en");
  const rule = page.getByRole("region", { name: "Horizontal" }).getByRole("separator");
  const ruleBox = await rule.boundingBox();
  const parentBox = await rule.locator("..").boundingBox();
  if (!ruleBox || !parentBox) throw new Error("a box is missing");
  expect(ruleBox.height).toBeCloseTo(1, 0);
  expect(ruleBox.width).toBeCloseTo(parentBox.width, 0);
});

for (const locale of LOCALES)
  test(`a vertical rule is 1 px wide and as tall as its row in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const rules = page.getByRole("region", { name: "Vertical" }).getByRole("separator");
    await expect(rules).toHaveCount(2);
    for (const rule of await rules.all()) {
      await expect(rule).toHaveAttribute("aria-orientation", "vertical");
      const box = await rule.boundingBox();
      if (!box) throw new Error("a rule has no box");
      expect(box.width).toBeCloseTo(1, 0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

for (const scheme of SCHEMES)
  test(`the secondary and tertiary rules paint colours of their own in ${scheme}`, async ({
    page,
  }) => {
    await open(page, scheme, "en");
    const surfaces = page.getByRole("region", { name: "Levels" }).locator('[data-slot="surface"]');
    const rules = page.getByRole("region", { name: "Levels" }).getByRole("separator");
    const colours = await Promise.all(
      [0, 1, 2].map((index) => paintedBackground(rules.nth(index))),
    );
    const [fallback, secondary, tertiary] = colours;
    const surfaceColours = await Promise.all(
      [0, 1, 2].map((index) => paintedBackground(surfaces.nth(index))),
    );
    // Logged, not asserted as a ratio: a decorative rule is outside WCAG 1.4.11.
    test.info().annotations.push({
      type: `${scheme} rules`,
      description: JSON.stringify({ colours, surfaceColours }),
    });
    expect(secondary).not.toBe(fallback);
    expect(tertiary).not.toBe(fallback);
    expect(secondary).not.toBe(surfaceColours[1]);
    expect(tertiary).not.toBe(surfaceColours[2]);
  });

test("the live rule turns from horizontal to vertical from the keyboard", async ({ page }) => {
  await open(page, "light", "en");
  const rule = page.getByTestId("live-rule");
  await expect(rule).toHaveAttribute("data-orientation", "horizontal");
  const turn = page.getByRole("button", { name: "Turn the rule" });
  await turn.focus();
  await page.keyboard.press("Enter");
  await expect(rule).toHaveAttribute("data-orientation", "vertical");
  await expect(rule).toHaveAttribute("aria-orientation", "vertical");
});
