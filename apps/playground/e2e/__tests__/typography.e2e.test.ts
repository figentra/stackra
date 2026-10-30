/**
 * Stackra file contract:
 * Purpose: proves the theme's type scale reaches HeroUI Typography in the browser: each Text type and heading style
 *          has the theme's computed size, line height and letter spacing, the Arabic styles apply to text marked
 *          `lang="ar"` on a Latin and on an Arabic page and the Latin ones to `lang="en"` text, the bold weight beats
 *          the `font` shorthand, truncation ends in an ellipsis, and the heading outline is as the page declares.
 * Boundary: the production build under `vite preview`; Chromium only. The playground's own UI is English
 *          (`lang="en"`) in both page directions, so unmarked samples draw the Latin styles in both.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decisions 8 and 9); ADR 0182 (test tiers); ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-020 sta-350:FR-021 sta-350:P-012 sta-350:P-015 sta-350:SC-004
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { fontStackOf } from "@stackra/tokens";
import { buildBrandTheme } from "../../src/constants/brand-themes/build-brand-theme.function";
import STACKRA from "../../src/constants/brand-themes/stackra.json" with { type: "json" };

/** The theme the page draws: the Stackra steel layer over the base (`SHOWCASE_THEME`), not the bare base theme. */
const SHOWCASE_THEME = buildBrandTheme(STACKRA);

const LOCALES = ["en", "ar"] as const;

/** Each Text type, with the theme token it draws, and each heading style (its own token). */
const TEXT_TYPES = ["body", "small", "caption"] as const;
const HEADING_TYPES = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

/** The live examples, without the Stackra section's hidden copies of the usage (which repeat its test ids). */
const demos = (page: Page) => page.locator("section:is(#usage, #examples)");

const open = async (page: Page, locale: string) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(`/typography?scheme=light&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Typography", locale) }),
  ).toBeVisible();
};

/** The computed type of an element, in numbers: px for the lengths (`normal` letter spacing is 0). */
const typeOf = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      size: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      letterSpacing: style.letterSpacing === "normal" ? 0 : Number.parseFloat(style.letterSpacing),
      weight: Number(style.fontWeight),
      family: style.fontFamily,
    };
  });

/** What the theme says a token draws: px for each length, as the renderers compute them. */
const tokenOf = (name: string) => {
  const style = SHOWCASE_THEME.typography[name];
  if (!style) throw new Error(`the theme has no ${name} token`);
  const size = Number.parseFloat(style.size);
  const em = (value: string) => Number.parseFloat(value) * size;
  return {
    size,
    lineHeight: style.lineHeight.endsWith("px")
      ? Number.parseFloat(style.lineHeight)
      : size * Number.parseFloat(style.lineHeight),
    letterSpacing: style.letterSpacing.endsWith("em")
      ? em(style.letterSpacing)
      : Number.parseFloat(style.letterSpacing),
    weight: style.weight,
    family: style.family,
  };
};

/** The first family of a stack, unquoted: `Geist` or `IBM Plex Sans Arabic`. */
const firstFamily = (stack: string) => stack.split(",")[0]?.replaceAll(/["']/g, "").trim();

/** Expects the element to draw the theme's token: size, line height, letter spacing, weight and first family. */
const expectToken = async (locator: Locator, name: string) => {
  const actual = await typeOf(locator);
  const expected = tokenOf(name);
  expect(actual.size, `${name} size`).toBeCloseTo(expected.size, 1);
  expect(actual.lineHeight, `${name} line height`).toBeCloseTo(expected.lineHeight, 1);
  expect(actual.letterSpacing, `${name} letter spacing`).toBeCloseTo(expected.letterSpacing, 1);
  expect(actual.weight, `${name} weight`).toBe(expected.weight);
  expect(firstFamily(actual.family), `${name} family`).toBe(
    firstFamily(fontStackOf(SHOWCASE_THEME, expected.family)),
  );
};

for (const locale of LOCALES) {
  test(`draws every Text type in the theme's scale, Latin and Arabic, on the ${locale} page`, async ({
    page,
  }) => {
    await open(page, locale);
    for (const type of TEXT_TYPES) {
      await expectToken(demos(page).getByTestId(`text-${type}`), type);
      await expectToken(demos(page).getByTestId(`text-${type}-ar`), `${type}-ar`);
    }
  });

  test(`draws every heading style in the theme's scale, Latin and Arabic, on the ${locale} page`, async ({
    page,
  }) => {
    await open(page, locale);
    for (const type of HEADING_TYPES) {
      await expectToken(demos(page).getByTestId(`heading-${type}`), type);
      await expectToken(demos(page).getByTestId(`heading-${type}-ar`), `${type}-ar`);
    }
  });

  test(`takes the style of the language a sample is marked with on the ${locale} page`, async ({
    page,
  }) => {
    await open(page, locale);
    await expectToken(demos(page).getByTestId("lang-ar"), "body-ar");
    await expectToken(demos(page).getByTestId("lang-en"), "body");
  });
}

test("draws each heading level in its own style", async ({ page }) => {
  await open(page, "en");
  for (const level of [3, 4, 5, 6])
    await expectToken(demos(page).getByTestId(`level-${level}`), `h${level}`);
});

test("keeps the bold weight against the font shorthand of the type", async ({ page }) => {
  await open(page, "en");
  expect((await typeOf(demos(page).getByTestId("weight-bold"))).weight).toBe(700);
});

test("cuts a truncated sample to one line with an ellipsis", async ({ page }) => {
  await open(page, "en");
  const sample = demos(page).getByTestId("truncated");
  const facts = await sample.evaluate((element) => ({
    overflow: getComputedStyle(element).textOverflow,
    whiteSpace: getComputedStyle(element).whiteSpace,
    isCut: element.scrollWidth > element.clientWidth,
  }));
  expect(facts).toEqual({ overflow: "ellipsis", whiteSpace: "nowrap", isCut: true });
  const wrapped = await page
    .getByTestId("wrapped")
    .evaluate((element) => getComputedStyle(element).whiteSpace);
  expect(wrapped).not.toBe("nowrap");
});

test("declares one level-1 heading and the levels 4 to 6 once each", async ({ page }) => {
  await open(page, "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const level of [4, 5, 6])
    await expect(page.getByRole("heading", { level }), `level ${level}`).toHaveText(
      `Level ${level}`,
    );
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});

test("changes the live tone when its button is pressed", async ({ page }) => {
  await open(page, "en");
  await page.getByRole("button", { name: "Next tone" }).click();
  await expect(page.locator("section#example-live").getByRole("status")).toHaveText(
    "Tone muted, pressed 1 time.",
  );
  await expect(demos(page).getByTestId("live-text")).toHaveClass(/typography--color-muted/);
});
