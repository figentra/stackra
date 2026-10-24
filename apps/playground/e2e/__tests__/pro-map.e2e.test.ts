/**
 * Stackra file contract:
 * Purpose: the Map page in Chromium: every marker label holds 4.5:1 against the plain colour the page paints the map
 *          with, in light and dark. The labels are drawn over MapLibre's canvas, whose colour axe cannot read, so
 *          `playground.e2e.test.ts` leaves their contrast to this suite.
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
