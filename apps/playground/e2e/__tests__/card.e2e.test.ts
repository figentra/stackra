/**
 * Stackra file contract:
 * Purpose: the card route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each level card paints its surface colour, a card has the theme's shadow
 *          and a transparent one has none; the titles sit in the outline at level 3 and 4 and the article is named by
 *          its title; and the dismissible card hides and comes back from the keyboard.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0182 (test tiers); ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-032 sta-350:P-019 sta-350:P-020 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/card?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Card" })).toBeVisible();
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
    test(`axe finds nothing on the card page in ${scheme}, ${locale}`, async ({ page }) => {
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
  test(`each level card paints its surface colour, and only a transparent one has no shadow, in ${scheme}`, async ({
    page,
  }) => {
    await open(page, scheme, "en");
    const cards = page.getByRole("region", { name: "Levels" }).locator('[data-slot="card"]');
    await expect(cards).toHaveCount(4);
    const levels = ["surface", "surface-secondary", "surface-tertiary"];
    for (const [index, variable] of levels.entries()) {
      expect(await paintedBackground(cards.nth(index)), `${variable} in ${scheme}`).toBe(
        await paintedVariable(page, variable),
      );
      // The theme's surface ring: a shadow is drawn.
      expect(
        await cards.nth(index).evaluate((element) => getComputedStyle(element).boxShadow),
        `${variable} shadow`,
      ).not.toBe("none");
    }
    expect(await cards.nth(3).evaluate((element) => getComputedStyle(element).boxShadow)).toBe(
      "none",
    );
  });

test("the titles sit in the outline at level 3 and 4, and the article is named by its title", async ({
  page,
}) => {
  await open(page, "light", "en");
  const titles = page.getByRole("region", { name: "Title levels" });
  await expect(titles.getByRole("heading", { level: 3, name: "Subscription" })).toBeVisible();
  await expect(titles.getByRole("heading", { level: 4, name: "Add-ons" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Release notes" })).toBeVisible();
  // One h1, and no level skipped on the way down: the level-2 sections hold the level-3 titles.
  const levels = await page
    .getByRole("main")
    .getByRole("heading")
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));
  for (const [index, level] of levels.entries()) {
    if (index > 0)
      expect(level - (levels[index - 1] ?? 0), `heading ${index}`).toBeLessThanOrEqual(1);
  }
});

test("the dismissible card hides from the keyboard and Show again brings it back", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dismissible = page.getByRole("region", { name: "Dismissible" });
  const close = dismissible.getByRole("button", { name: "Dismiss card" });
  await close.focus();
  await page.keyboard.press("Enter");
  await expect(dismissible.getByRole("heading", { name: "Your changes were saved" })).toHaveCount(
    0,
  );
  const again = dismissible.getByRole("button", { name: "Show again" });
  await again.focus();
  await page.keyboard.press("Space");
  await expect(dismissible.getByRole("heading", { name: "Your changes were saved" })).toBeVisible();
});

test("the close button sits at the end corner of its card in both directions", async ({ page }) => {
  for (const locale of LOCALES) {
    await open(page, "light", locale);
    const card = page.getByRole("region", { name: "Dismissible" }).locator('[data-slot="card"]');
    const close = card.getByRole("button", { name: "Dismiss card" });
    const cardBox = await card.boundingBox();
    const closeBox = await close.boundingBox();
    if (!cardBox || !closeBox) throw new Error("a box is missing");
    const closeCentre = closeBox.x + closeBox.width / 2;
    const cardCentre = cardBox.x + cardBox.width / 2;
    expect(closeCentre > cardCentre, locale).toBe(locale === "en");
  }
});
