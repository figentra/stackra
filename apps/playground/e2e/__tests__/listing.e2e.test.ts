/**
 * Stackra file contract:
 * Purpose: the component listing by width: on a phone (390px) the home's categories and the components index are
 *          shelves whose cards swipe sideways (a card 85% of the row wide, the next one peeking, the row starting at
 *          the right in Arabic) and a category page is one card per row; at 768px the cards are two per row, at
 *          1440px three. Each phone view passes axe (WCAG 2.0 to 2.2, A and AA, and best practices) in light and
 *          dark, left to right and right to left, with nothing left incomplete.
 * Boundary: the production build under `vite preview`; Chromium only. The desktop axe sweep of every route is
 *           `playground.e2e.test.ts`.
 * Runtime: node
 * Governing contract: STA-1371 (listing by width, 2026-10-28); ADR 0302 (decision 5); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The first card list of a page: the home's categories, else the index's first shelf. */
const firstList = (page: Page, path: string) =>
  page.locator(path === "/" ? '[aria-labelledby="home-categories"] ul' : "main section ul").first();

/** The number of distinct card columns among the first cards of a list (by their left edges). */
const columnsOf = (list: Locator) =>
  list.evaluate((element) => {
    const lefts = [...element.children]
      .slice(0, 6)
      .map((child) => Math.round(child.getBoundingClientRect().left));
    return new Set(lefts).size;
  });

for (const scheme of ["light", "dark"] as const)
  for (const { locale, dir } of [
    { locale: "en", dir: "ltr" },
    { locale: "ar", dir: "rtl" },
  ] as const)
    for (const path of ["/", "/components", "/components/actions"])
      test(`${path} on a phone in ${scheme}, ${dir} lists readable cards and passes axe`, async ({
        page,
      }) => {
        // A whole index of live thumbnails for axe to walk: more than the default 30 seconds.
        test.slow();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        await page.goto(`${path}?scheme=${scheme}&locale=${locale}`);
        await expect(page.locator("html")).toHaveAttribute("dir", dir);
        // The page has drawn its h1 (the home's hero arrives after the first cards), so axe scans a finished page.
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
        const list = firstList(page, path);
        await list.scrollIntoViewIfNeeded();
        const row = await list.boundingBox();
        const card = await list.locator("> li").first().boundingBox();
        if (!row || !card) throw new Error("no list or card");
        if (path === "/components/actions") {
          // One full-width card per row.
          expect(card.width).toBeGreaterThan(row.width * 0.95);
        } else {
          // A swipeable row: the card is about 85% of the screen, the next one peeks in.
          expect(card.width).toBeGreaterThan(390 * 0.75);
          expect(card.width).toBeLessThan(390 * 0.9);
          expect(await list.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
            true,
          );
          // The row starts at the reading edge: the right in Arabic.
          if (dir === "rtl") expect(card.x + card.width).toBeGreaterThan(390 - 24);
          else expect(card.x).toBeLessThan(24);
        }
        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags(AXE_TAGS)
          .analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
        ).toEqual([]);
        expect(
          incomplete.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
        ).toEqual([]);
      });

for (const { width, columns } of [
  { width: 768, columns: 2 },
  { width: 1440, columns: 3 },
])
  for (const path of ["/", "/components"])
    test(`${path} at ${width}px lists ${columns} cards per row`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${path}?scheme=light&locale=en`);
      const list = firstList(page, path);
      await list.scrollIntoViewIfNeeded();
      expect(await columnsOf(list)).toBe(columns);
    });
