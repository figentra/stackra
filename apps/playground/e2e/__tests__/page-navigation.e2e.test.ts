/**
 * Stackra file contract:
 * Purpose: the component page's navigation end to end: scrolling a long page step by step only ever moves the "On
 *          this page" mark forward (no zigzag); a click on a row marks it at once and holds it through the smooth
 *          scroll, with the hash replaced rather than pushed; the sidebar's current row lies wholly inside its
 *          scrolling frame (its pill never cut by the clipping edge) in left-to-right and right-to-left; and below
 *          `xl` the rail is the "On this page" menu.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2; ADR 0182 (test tiers); ADR 0022 (test
 *          placement).
 */
import { expect, test, type Page } from "@playwright/test";

import { visit } from "../support/visit.function";

/** The rail's rows' ids, in order, and the index of the one marked. */
const railState = (page: Page) =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>("nav.toc-rail .toc-link")];
    return links.findIndex((link) => link.getAttribute("aria-current") === "location");
  });

test.use({ viewport: { width: 1440, height: 900 } });

test("scrolling down a long page only ever moves the mark forward", async ({ page }) => {
  await visit(page, "/button", "light");
  const seen: number[] = [];
  for (let step = 0; step < 200; step += 1) {
    const isAtEnd = await page.evaluate(() => {
      window.scrollBy(0, 120);
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    });
    // Two frames: the spy measures on the next animation frame.
    await page.evaluate(
      () =>
        new Promise((done) => {
          requestAnimationFrame(() => requestAnimationFrame(done));
        }),
    );
    seen.push(await railState(page));
    if (isAtEnd) break;
  }
  expect(seen.length).toBeGreaterThan(10);
  expect(seen, "the mark moved back while scrolling down").toEqual([...seen].sort((a, b) => a - b));
  // The bottom of the page marks the last row.
  const rows = await page.locator("nav.toc-rail .toc-link").count();
  expect(seen.at(-1)).toBe(rows - 1);
});

test("a click marks its row at once and holds it through the smooth scroll", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto("/button?scheme=light&locale=en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const history = await page.evaluate(() => window.history.length);
  const rail = page.getByRole("navigation", { name: "On this page" }).last();
  await rail.getByRole("link", { name: "Accessibility" }).click();
  const samples: (string | null)[] = [];
  for (let sample = 0; sample < 15; sample += 1) {
    samples.push(
      await page.evaluate(
        () =>
          document.querySelector('nav.toc-rail .toc-link[aria-current="location"]')?.textContent ??
          null,
      ),
    );
    await page.waitForTimeout(50);
  }
  expect(new Set(samples)).toEqual(new Set(["Accessibility"]));
  expect(page.url()).toMatch(/#accessibility$/);
  expect(await page.evaluate(() => window.history.length)).toBe(history);
});

for (const locale of ["en", "ar"] as const)
  test(`the sidebar's current row lies wholly inside its frame, ${locale}`, async ({ page }) => {
    await visit(page, "/form-field", "dark", locale);
    const box = await page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>("nav.playground-sidebar");
      const row = frame?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!frame || !row) return undefined;
      const outer = frame.getBoundingClientRect();
      const inner = row.getBoundingClientRect();
      // The frame's content box: its scrollbar (when it takes room) is not room for the row.
      const scrollbar = frame.offsetWidth - frame.clientWidth;
      const isRtl = getComputedStyle(frame).direction === "rtl";
      return {
        start: isRtl ? outer.right - inner.right : inner.left - outer.left,
        end: isRtl ? inner.left - outer.left - scrollbar : outer.right - scrollbar - inner.right,
        top: inner.top - outer.top,
        bottom: outer.bottom - inner.bottom,
      };
    });
    expect(box, "the sidebar and its current row").toBeDefined();
    for (const [edge, gap] of Object.entries(box ?? {}))
      expect(gap, `room on the row's ${edge} side`).toBeGreaterThanOrEqual(0);
  });

test.describe("below xl", () => {
  test.use({ viewport: { width: 1100, height: 900 } });

  test("the rail is a menu at the top of the page that jumps and closes", async ({ page }) => {
    await visit(page, "/button", "light");
    const menu = page.locator("details.toc-menu");
    await expect(menu).toBeVisible();
    await expect(page.locator("nav.toc-rail")).toBeHidden();
    await menu.locator("summary").click();
    await menu.getByRole("link", { name: "Styling" }).click();
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(/#styling$/);
  });
});
