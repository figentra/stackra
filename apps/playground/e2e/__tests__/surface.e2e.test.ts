/**
 * Stackra file contract:
 * Purpose: the surface route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every level paints the theme's surface colour (and `transparent` paints
 *          none), nested surfaces paint three different colours, and the live surface repaints at the level picked.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-032 sta-350:P-019 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/surface?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Surface" })).toBeVisible();
};

/** A computed colour property as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const painted = (locator: Locator, property: "color" | "backgroundColor") =>
  locator.evaluate((element, name) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element)[name];
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, property);

/** What a theme variable paints as a background, read from a probe element that is removed again. */
const paintedVariable = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(--${variable})`;
    document.body.append(probe);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(probe).backgroundColor;
    probe.remove();
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, name);

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the surface page in ${scheme}, ${locale}`, async ({ page }) => {
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
  test(`every level paints the theme's surface colour in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const surfaces = page.getByRole("region", { name: "Levels" }).locator('[data-slot="surface"]');
    await expect(surfaces).toHaveCount(4);
    const expected = ["surface", "surface-secondary", "surface-tertiary"];
    for (const [index, variable] of expected.entries()) {
      expect(
        await painted(surfaces.nth(index), "backgroundColor"),
        `${variable} in ${scheme}`,
      ).toBe(await paintedVariable(page, variable));
    }
    // `transparent` paints nothing: its computed background has no alpha.
    expect(
      await surfaces.nth(3).evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toMatch(/^rgba\(0, 0, 0, 0\)$|^transparent$/);
  });

test("nested surfaces paint three different colours", async ({ page }) => {
  await open(page, "light", "en");
  const nested = page.getByRole("region", { name: "Nested" }).locator('[data-slot="surface"]');
  await expect(nested).toHaveCount(3);
  const colours = await Promise.all(
    [0, 1, 2].map((index) => painted(nested.nth(index), "backgroundColor")),
  );
  expect(new Set(colours).size).toBe(3);
});

test("the live surface repaints at the level that is picked", async ({ page }) => {
  await open(page, "dark", "en");
  const live = page.getByTestId("live-surface");
  await page.getByRole("button", { name: "Use tertiary" }).click();
  await expect(page.getByRole("button", { name: "Use tertiary" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await painted(live, "backgroundColor")).toBe(
    await paintedVariable(page, "surface-tertiary"),
  );
  await expect(live).toContainText("This surface is tertiary.");
});
