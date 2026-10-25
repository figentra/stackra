/**
 * Stackra file contract:
 * Purpose: the Map page in Chromium: MapLibre's worker loads, so the route's GeoJSON source draws; the open popup stays
 *          inside the map and off every marker label at a desktop and a phone width; and every marker label holds
 *          4.5:1 against the plain colour the page paints the map with, in light and dark. The labels are drawn over
 *          MapLibre's canvas, whose colour axe cannot read, so `playground.e2e.test.ts` leaves their contrast here.
 * Boundary: the production build under `vite preview`; Chromium only. The map colours are the page's own map style
 *          (`STYLES` in `pro-map.tsx`): it draws no tiles, only one background colour per scheme.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { expect, test } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

import { SCHEMES, visit } from "../support/pro-page";

const PATH = "/pro-map";
const MAP_COLOUR = { light: "#e5e7eb", dark: "#1f2937" } as const;

test("loads MapLibre's worker, so the map finishes loading with its route source", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await visit(page, PATH, "light");
  await expect(page.locator('[data-slot="map"][data-loaded="true"]')).toBeVisible();
  // The route is a GeoJSON source, which MapLibre parses in its worker; a missing worker logs "Worker failed to
  // load" shortly after the map loads, so give it a moment to say so.
  await page.waitForTimeout(1000);
  expect(errors.filter((text) => /worker/i.test(text))).toEqual([]);
});

for (const width of [1280, 390])
  test(`keeps the open popup inside the map and off every label at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await visit(page, PATH, "light");
    await expect(page.locator('[data-slot="map"][data-loaded="true"]')).toBeVisible();
    const popup = page.locator(".maplibregl-popup");
    await expect(popup).toBeVisible();
    const map = await page.locator('[data-slot="map"]').boundingBox();
    const box = await popup.boundingBox();
    if (!map || !box) throw new Error("no map or popup box");
    expect(box.x).toBeGreaterThanOrEqual(map.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(map.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(map.x + map.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(map.y + map.height + 1);
    for (const label of await page.locator('[data-slot="map-marker-label"]').all()) {
      const other = await label.boundingBox();
      if (!other) continue;
      const overlaps =
        box.x < other.x + other.width &&
        other.x < box.x + box.width &&
        box.y < other.y + other.height &&
        other.y < box.y + box.height;
      expect(overlaps, `the popup covers "${await label.textContent()}"`).toBe(false);
    }
  });

for (const scheme of SCHEMES)
  test(`every marker label holds 4.5:1 against the map in ${scheme}`, async ({ page }) => {
    await visit(page, PATH, scheme);
    const labels = page.locator('[data-slot="map-marker-label"]');
    await expect(labels.first()).toBeVisible();
    expect(await labels.count()).toBeGreaterThan(0);
    for (const label of await labels.all()) {
      // The text colour as `#rrggbb`, drawn on a 2d canvas so any CSS colour form (oklch too) reads.
      const text = await label.evaluate((element) => {
        const context = document.createElement("canvas").getContext("2d");
        if (!context) throw new Error("no 2d canvas");
        context.fillStyle = getComputedStyle(element).color;
        context.fillRect(0, 0, 1, 1);
        const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
        return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
      });
      const ratio = contrastRatio(text, MAP_COLOUR[scheme]);
      expect(ratio, `${scheme}: ${await label.textContent()}`).toBeGreaterThanOrEqual(4.5);
    }
  });
