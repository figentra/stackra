/**
 * Stackra file contract:
 * Purpose: the landing heroes' end-to-end checks. Each hero (`?hero=stack|storm|mirror`) has one h1 that starts the
 *          document title, passes axe (no violation, nothing incomplete) in light, dark, English and Arabic, and fits a
 *          phone without sideways scrolling; the theme storm passes axe in every theme it turns through. With motion,
 *          the storm re-themes on its own and stops when paused, the mirror's card turns to the other language and the
 *          stack assembles and explodes; with reduced motion nothing turns on its own. A new visit on the same device
 *          shows the next hero, and the Display menu switches the hero for this visit.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (three rotating heroes); ADR 0302 (decision 5); WCAG 2.2 SC 1.4.10,
 *          2.2.2, 2.3.3; ADR 0060 (right-to-left); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeFindings } from "../support/expect-no-axe-findings.function";

// A whole-page axe scan of the index (the hero, the group cards' live previews and the showcase) takes most of 30 s.
test.describe.configure({ timeout: 120_000 });

const HEROES = ["stack", "storm", "mirror"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;

/** Opens the index on `hero` at rest (reduced motion, so nothing is mid-turn), and waits for its h1. */
const open = async (
  page: Page,
  hero: string,
  scheme: (typeof SCHEMES)[number] = "light",
  locale: (typeof LOCALES)[number] = "en",
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion });
  await page.goto(`/?hero=${hero}&scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

/** The theme storm's theme pills, by the group's name in the page's language. */
const themePills = (page: Page, locale: (typeof LOCALES)[number] = "en") =>
  page.getByRole("radiogroup", { name: locale === "ar" ? "السمات" : "Themes" }).getByRole("radio");

/** The hero of this tab's visit, as the page keeps it. */
const visitHero = (page: Page) =>
  page.evaluate(() => sessionStorage.getItem("stackra-playground:hero"));

for (const hero of HEROES)
  for (const scheme of SCHEMES)
    for (const locale of LOCALES)
      test(`the ${hero} hero has one h1 and passes axe in ${scheme}, ${locale}`, async ({
        page,
      }) => {
        await open(page, hero, scheme, locale);
        const heading = page.getByRole("heading", { level: 1 });
        await expect(heading).toHaveCount(1);
        await expect(page).toHaveTitle(new RegExp(`^${await heading.textContent()} · `));
        expect(await visitHero(page)).toBe(hero);
        await expectNoAxeFindings(page);
      });

for (const hero of HEROES)
  test(`the ${hero} hero fits a phone without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, hero, "light", "ar");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`the theme storm passes axe in every theme, ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, "storm", scheme, locale);
      const pills = themePills(page, locale);
      await expect(pills).toHaveCount(5);
      for (let index = 0; index < 5; index++) {
        await pills.nth(index).click();
        await expect(pills.nth(index)).toBeChecked();
        // The hero alone: the rest of the page does not change with the theme, and the scans above cover it.
        const { violations, incomplete } = await new AxeBuilder({ page })
          .include('[aria-labelledby="hero-title"]')
          .withTags(AXE_TAGS)
          .analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
        ).toEqual([]);
        expect(
          incomplete.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
        ).toEqual([]);
      }
    });

test("the theme storm re-themes on its own and stops when paused", async ({ page }) => {
  await open(page, "storm", "light", "en", "no-preference");
  const checked = page
    .getByRole("radiogroup", { name: "Themes" })
    .getByRole("radio", { checked: true });
  const first = await checked.textContent();
  await expect(checked).not.toHaveText(first ?? "", { timeout: 5000 });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play themes" })).toBeVisible();
  // Whichever theme the pause caught (a turn may land as the button is pressed) stays put.
  const held = await checked.textContent();
  await page.waitForTimeout(4000);
  await expect(checked).toHaveText(held ?? "");
});

test("the theme storm never turns on its own under reduced motion", async ({ page }) => {
  await open(page, "storm");
  await page.waitForTimeout(4000);
  await expect(themePills(page).nth(0)).toBeChecked();
  await expect(page.getByRole("button", { name: /^(Pause|Play themes)$/ })).toHaveCount(0);
});

test("the mirror's card turns to the other language, and the toggle picks one", async ({
  page,
}) => {
  await open(page, "mirror", "light", "en", "no-preference");
  const card = page.locator('[aria-labelledby="hero-title"] [inert] [lang]').first();
  await expect(card).toHaveAttribute("lang", "en");
  await expect(card).toHaveAttribute("lang", "ar", { timeout: 6000 });
  await expect(card).toHaveAttribute("dir", "rtl");
  await page.getByRole("radio", { name: "English (LTR)" }).click();
  await expect(card).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Play the switch" })).toBeVisible();
});

test("the stack assembles and explodes", async ({ page }) => {
  await open(page, "stack", "dark", "en", "no-preference");
  await page.getByRole("button", { name: "Assemble the stack" }).click();
  await page.getByRole("button", { name: "Explode the stack" }).click();
  await expect(page.getByRole("button", { name: "Assemble the stack" })).toBeVisible();
});

test("a new visit on the same device shows the next hero, and keeps it for the visit", async ({
  context,
}) => {
  const order = ["stack", "storm", "mirror"];
  const first = await context.newPage();
  await first.goto("/?scheme=light&locale=en");
  await expect(first.getByRole("heading", { level: 1 })).toBeVisible();
  const seen = await visitHero(first);
  expect(order).toContain(seen);
  // The same visit keeps its hero.
  await first.goto("/components?scheme=light&locale=en");
  await first.goto("/?scheme=light&locale=en");
  expect(await visitHero(first)).toBe(seen);
  // A new tab is a new visit: the next hero in turn.
  const next = await context.newPage();
  await next.goto("/?scheme=light&locale=en");
  await expect(next.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await visitHero(next)).toBe(order[(order.indexOf(seen ?? "") + 1) % order.length]);
});

test("the Display menu switches the hero for this visit", async ({ page }) => {
  await open(page, "stack");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tokens. Components. Products.");
  await page
    .getByRole("banner")
    .getByRole("button", { name: /^(Display|العرض)$/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Landing hero/ })
    .click();
  await page.getByRole("option", { name: "English and Arabic" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build once. Theme anywhere.");
  expect(await visitHero(page)).toBe("mirror");
});
