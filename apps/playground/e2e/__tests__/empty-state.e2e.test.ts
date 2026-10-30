/**
 * Stackra file contract:
 * Purpose: the empty state route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, also with the no-results state showing; every state has a level-3
 *          heading and a decorative 24 px icon centred above it in both directions; every action reaches 24 px; and a
 *          search that matches nothing turns the list into the no-results state, announced as a count, whose button
 *          brings the list back and returns focus to the search field.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay, and none opens here, so role queries work throughout.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decisions 5 and 6); ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-151 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

/** The live examples, without the Stackra section's hidden preview copies of the usage. */
const DEMOS = "section:is(#usage, #examples)";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/empty-state?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Empty state", locale) }),
  ).toBeVisible();
};

/** Runs axe over the page and expects neither violations nor checks left for review. */
const expectAxeClean = async (page: Page) => {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    violations.map((finding) => finding.id),
    "axe violations",
  ).toEqual([]);
  expect(
    incomplete.map((finding) => finding.id),
    "axe checks left for review",
  ).toEqual([]);
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the empty state page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing with the no-results state showing in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      // By id and place: the words speak the page's locale.
      const live = example(page, "live");
      await live.getByRole("searchbox").fill("zzz");
      await expect(
        live.locator('[data-reason="no-results"]').getByRole("heading", { level: 3 }),
      ).toBeVisible();
      await expectAxeClean(page);
    });
  }

test("every reason has a level-3 heading, and none skips an outline level", async ({ page }) => {
  await open(page, "light", "en");
  const reasons = page.getByRole("region", { name: "Usage" });
  for (const name of ["No orders yet", "No orders match your filters", "You cannot see orders"])
    await expect(reasons.getByRole("heading", { level: 3, name })).toBeVisible();
  await expect(page.locator(DEMOS).getByRole("heading", { level: 4 })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`every icon is 24 px, decorative and centred above its title in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const states = page.locator(DEMOS).locator("[data-reason]");
    await expect(states).toHaveCount(3 + 4);
    for (const state of await states.all()) {
      const well = state.locator('[data-slot="state-icon"]');
      if ((await well.count()) === 0) continue;
      const icon = well.locator("svg");
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      const iconBox = await icon.boundingBox();
      const wellBox = await well.boundingBox();
      const rootBox = await state.boundingBox();
      const titleBox = await state.getByRole("heading").boundingBox();
      if (!iconBox || !wellBox || !rootBox || !titleBox) throw new Error("a box is missing");
      expect([Math.round(iconBox.width), Math.round(iconBox.height)]).toEqual([24, 24]);
      // Stacked: the icon sits above the title, and both are centred in the state, in either direction.
      expect(wellBox.y + wellBox.height).toBeLessThanOrEqual(titleBox.y);
      const rootCentre = rootBox.x + rootBox.width / 2;
      expect(Math.abs(wellBox.x + wellBox.width / 2 - rootCentre), locale).toBeLessThanOrEqual(1.5);
    }
  });

test("every action reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = page.locator(DEMOS).locator("[data-reason]").getByRole("button");
  await expect(page.locator(DEMOS).locator("[data-reason]")).toHaveCount(3 + 4);
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    if (!box) throw new Error("a button has no box");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("a state with no icon draws no icon well, and one with an icon of its own draws it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const parts = page.getByRole("region", { name: "Parts" });
  const noIcon = parts.locator("[data-reason]").filter({ hasText: "No orders match your filters" });
  await expect(noIcon.locator('[data-slot="state-icon"]')).toHaveCount(0);
  const ownIcon = parts.locator("[data-reason]").filter({ hasText: "Importing is paused" });
  await expect(ownIcon.locator('[data-slot="state-icon"] svg')).toHaveCount(1);
});

test("a search with no match shows the no-results state, a button brings the list back and focus returns", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const search = live.getByRole("searchbox", { name: "Search orders" });
  await expect(live.getByRole("listitem")).toHaveCount(4);
  await expect(live.getByRole("status")).toHaveText("4 orders shown.");

  await search.fill("zzz");
  await expect(live.getByRole("listitem")).toHaveCount(0);
  await expect(live.getByRole("status")).toHaveText("No orders match.");
  await expect(
    live.getByRole("heading", { level: 3, name: "No orders match your filters" }),
  ).toBeVisible();

  await live.getByRole("button", { name: "Show all orders" }).focus();
  await page.keyboard.press("Enter");
  await expect(live.getByRole("listitem")).toHaveCount(4);
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
});
