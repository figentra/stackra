/**
 * Stackra file contract:
 * Purpose: the live preview frames' overlays: a HeroUI Select opened in a brand frame (Figentra, Organza) or in the
 *          Arabic frame lists its options inside that frame, in its brand's colours and its direction, whole on screen
 *          rather than cut by the frame's card; and axe finds nothing in the open list.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: STA-1371 (live preview frames, react-aria portal provider approved 2026-10-29); ADR 0060 (RTL);
 *          ADR 0340 (decision 2: brand layers); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { visit } from "../support/visit.function";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Opens the first Select of the frame named `name` and returns the open list. */
const openIn = async (page: Page, name: RegExp) => {
  const frame = page.getByRole("region", { name }).first();
  await frame.scrollIntoViewIfNeeded();
  await frame.getByRole("button").first().click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  return list;
};

/** What the open list inherits: its frame's name, brand and accent, its direction and whether it is wholly on screen. */
const scopeOf = (page: Page) =>
  page.getByRole("listbox").evaluate((list) => {
    const frame = list.closest("[role=region][aria-label]");
    const box = list.getBoundingClientRect();
    return {
      frame: frame?.getAttribute("aria-label"),
      brand: frame?.getAttribute("data-brand") ?? undefined,
      accent: getComputedStyle(list).getPropertyValue("--accent").trim(),
      frameAccent: frame ? getComputedStyle(frame).getPropertyValue("--accent").trim() : "",
      direction: getComputedStyle(list).direction,
      isOnScreen: box.left >= 0 && box.right <= window.innerWidth && box.height > 0,
    };
  });

for (const { name, brand } of [
  { name: /^Figentra preview/, brand: "figentra" },
  { name: /^Organza preview/, brand: "organza" },
])
  test(`a Select in the ${brand} frame lists its options inside it, in the brand's colours`, async ({
    page,
  }) => {
    await visit(page, "/select", "light");
    await openIn(page, name);
    const scope = await scopeOf(page);
    expect(scope.brand).toBe(brand);
    expect(scope.accent).toBe(scope.frameAccent);
    expect(scope.direction).toBe("ltr");
    expect(scope.isOnScreen).toBe(true);
    const { violations, incomplete } = await new AxeBuilder({ page })
      .include("[role=listbox]")
      .withTags(AXE_TAGS)
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
    expect(incomplete.map((v) => v.id)).toEqual([]);
  });

test("a Select in the Arabic frame lists its options inside it, right to left", async ({
  page,
}) => {
  await visit(page, "/select", "light");
  await openIn(page, /^Arabic preview/);
  const scope = await scopeOf(page);
  expect(scope.frame).toMatch(/^Arabic preview/);
  expect(scope.direction).toBe("rtl");
  expect(scope.isOnScreen).toBe(true);
  const { violations, incomplete } = await new AxeBuilder({ page })
    .include("[role=listbox]")
    .withTags(AXE_TAGS)
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  expect(incomplete.map((v) => v.id)).toEqual([]);
});
