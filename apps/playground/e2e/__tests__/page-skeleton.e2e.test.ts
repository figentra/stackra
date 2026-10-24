/**
 * Stackra file contract:
 * Purpose: the page skeleton route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left, also while the live sample loads; each layout draws the bones the
 *          layout lists and keeps them inside its box in both directions; the page header mirrors in right-to-left;
 *          every skeleton is named once by one status and its bones say nothing; no skeleton animates under reduced
 *          motion; and the live sample goes from a named table skeleton back to its content while the button keeps
 *          focus.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0313 (decisions 1 and 6); ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.3.3 and 4.1.3.
 */
// @covers sta-350:FR-151 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The bones each layout draws, as `PAGE_SKELETON_ROWS` lists them. */
const BONES = { page: 6, table: 30, section: 5, form: 10 } as const;

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion });
  await page.goto(`/page-skeleton?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Page skeleton" })).toBeVisible();
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
    test(`axe finds nothing on the page skeleton page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing while the live sample loads in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const live = page.getByRole("region", { name: "Loading to content" });
      await live.getByRole("button", { name: "Reload orders" }).click();
      await expect(live.getByRole("status")).toHaveText("Loading orders");
      await expectAxeClean(page);
    });
  }

for (const [layout, count] of Object.entries(BONES))
  test(`the ${layout} layout draws ${count} bones`, async ({ page }) => {
    await open(page, "light", "en");
    const skeleton = page
      .getByRole("region", { name: "Layouts" })
      .locator(`[data-layout="${layout}"]`);
    await expect(skeleton.locator(".skeleton")).toHaveCount(count);
  });

for (const locale of LOCALES)
  test(`every bone sits inside its skeleton in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const skeletons = page.getByRole("region", { name: "Layouts" }).locator("[data-layout]");
    for (const skeleton of await skeletons.all()) {
      const rootBox = await skeleton.boundingBox();
      if (!rootBox) throw new Error("a skeleton has no box");
      for (const bone of await skeleton.locator(".skeleton").all()) {
        const box = await bone.boundingBox();
        if (!box) throw new Error("a bone has no box");
        expect(box.x, locale).toBeGreaterThanOrEqual(rootBox.x - 1);
        expect(box.x + box.width, locale).toBeLessThanOrEqual(rootBox.x + rootBox.width + 1);
      }
    }
  });

for (const locale of LOCALES)
  test(`the page header puts its title on the reading-start side in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const bones = page
      .getByRole("region", { name: "Layouts" })
      .locator('[data-layout="page"] .skeleton');
    const title = await bones.nth(0).boundingBox();
    const action = await bones.nth(1).boundingBox();
    if (!title || !action) throw new Error("a bone has no box");
    expect(title.x < action.x, locale).toBe(locale === "en");
  });

test("every skeleton is named once by one status, and its bones say nothing", async ({ page }) => {
  await open(page, "light", "en");
  const layouts = page.getByRole("region", { name: "Layouts" });
  await expect(layouts.getByRole("status")).toHaveCount(4);
  for (const layout of Object.keys(BONES))
    await expect(layouts.locator(`[data-layout="${layout}"]`).getByRole("status")).toHaveText(
      `Loading the ${layout} layout`,
    );
  await expect(layouts.locator(".skeleton").first()).toHaveText("");
  await expect(layouts.getByRole("img")).toHaveCount(0);
  await expect(layouts.getByRole("progressbar")).toHaveCount(0);
});

test("no skeleton animates under reduced motion", async ({ page }) => {
  await open(page, "light", "en", "reduce");
  const names = await page.evaluate(() =>
    [...document.querySelectorAll(".skeleton--shimmer, .skeleton--pulse")].flatMap((node) =>
      [null, "::after", "::before"].map((pseudo) => getComputedStyle(node, pseudo).animationName),
    ),
  );
  expect(names.length).toBeGreaterThan(0);
  expect(names.filter((name) => name !== "none")).toEqual([]);
});

test("the live sample goes from a named table skeleton back to its content, the button keeping focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Loading to content" });
  const demo = live.getByRole("group", { name: "Orders demo" });
  const reload = live.getByRole("button", { name: "Reload orders" });
  await expect(demo.getByRole("listitem")).toHaveCount(4);

  await reload.focus();
  await page.keyboard.press("Enter");
  await expect(demo.getByRole("status")).toHaveText("Loading orders");
  await expect(demo.getByRole("listitem")).toHaveCount(0);
  await expect(demo.locator('[data-layout="table"]')).toHaveCount(1);
  await expect(reload).toBeFocused();

  await expect(demo.getByRole("listitem")).toHaveCount(4);
  await expect(demo.getByRole("status")).toHaveCount(0);
  await expect(reload).toBeFocused();
});
