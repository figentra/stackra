/**
 * Stackra file contract:
 * Purpose: the single-column-layout route's own end-to-end checks: axe finds nothing (violations or incomplete) on the
 *          page in light, dark, left-to-right and right-to-left, also after the live layout has changed; the page holds
 *          one `h1` and its sections are level-3 headings; the stacked sections share one column, in order, with the
 *          layout's gap between them; the child wider than the column scrolls inside it (reachable from the keyboard)
 *          and the page itself does not scroll sideways, even at 320 px; the Arabic layout reads from the right; and the
 *          live layout's buttons add sections from the keyboard and the page reports the count.
 * Boundary: the production build under `vite preview`; Chromium only. The layout draws no landmark, so the checks use
 *           CSS locators for its box and role queries for the sections inside it.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0317 (decision 7); ADR 0060 (light, dark, RTL); ADR 0182 (test tiers);
 *          ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1 and 4.1.3.
 */
// @covers sta-350:FR-173 sta-350:SC-012 sta-350:SC-002
import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeFindings } from "../support/expect-no-axe-findings.function";
import { pageTitle } from "../support/page-title.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;

const open = async (page: Page, scheme: string, locale: string, width = 1280) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/single-column-layout?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Single column layout", locale) }),
  ).toBeVisible();
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

/** A sample's box, by its `data-sample`, in the examples (the Stackra section draws the usage demo again, hidden). */
const sample = (page: Page, name: string) =>
  page.locator("#usage, #examples").locator(`[data-sample="${name}"]`);

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the single column layout page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectNoAxeFindings(page);
    });

    test(`axe finds nothing after the live layout changes in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      // The demo speaks the page's language (`assets/lang/<locale>/single_column_layout.json`).
      await page
        .getByRole("button", { name: locale === "en" ? "Add a section" : "إضافة قسم" })
        .click();
      await expect(sample(page, "live").getByRole("heading", { level: 3 })).toHaveCount(3);
      await expectNoAxeFindings(page);
    });
  }

test("the page holds one h1 and its sections are level-3 headings", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(sample(page, "stacked").getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
});

test("the stacked sections share one column, in order, with the layout's gap between them", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The demos load lazily: wait for the sections before reading them.
  await expect(sample(page, "stacked").getByRole("region")).toHaveCount(3);
  const regions = await sample(page, "stacked").getByRole("region").all();
  const boxes = [] as { x: number; y: number; width: number; height: number }[];
  for (const region of regions) boxes.push(await boxOf(region));
  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1] as (typeof boxes)[number];
    const current = boxes[index] as (typeof boxes)[number];
    expect(current.x).toBeCloseTo(previous.x, 0);
    expect(current.width).toBeCloseTo(previous.width, 0);
    // gap-3 is 0.75 rem: 12 px at the default root size.
    expect(current.y - (previous.y + previous.height)).toBeCloseTo(12, 0);
  }
});

test("the child wider than the column scrolls inside it and can be scrolled from the keyboard", async ({
  page,
}) => {
  await open(page, "light", "en");
  const scroller = sample(page, "wide-scroller");
  const metrics = await scroller.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  await scroller.focus();
  await expect(scroller).toBeFocused();
  // An arrow key, not End: End scrolls a scroll container down, and this one only scrolls sideways.
  await page.keyboard.press("ArrowRight");
  // Polled: the browser animates a keyboard scroll.
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("the page does not scroll sideways at 320 px, wide child or not", async ({ page }) => {
  await open(page, "light", "en", 320);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const locale of LOCALES)
  test(`the Arabic layout reads from the right whatever the page's direction, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const section = sample(page, "arabic").getByRole("region").first();
    const box = await boxOf(section);
    const title = await boxOf(section.getByRole("heading", { level: 3 }));
    expect(title.x + title.width / 2).toBeGreaterThan(box.x + box.width / 2);
  });

test("the live layout's buttons add sections from the keyboard and the page reports the count", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sample(page, "live");
  await expect(sample(page, "live-status")).toHaveText("2 sections.");
  const add = page.getByRole("button", { name: "Add a section" });
  await add.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(live.getByRole("heading", { level: 3 })).toHaveCount(4);
  await expect(sample(page, "live-status")).toHaveText("4 sections.");
  await expect(add).toBeFocused();
  await page.getByRole("button", { name: "Remove a section" }).click();
  await expect(sample(page, "live-status")).toHaveText("3 sections.");
});
