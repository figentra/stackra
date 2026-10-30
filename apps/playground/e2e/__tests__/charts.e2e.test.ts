/**
 * Stackra file contract:
 * Purpose: the chart routes' end-to-end checks (area, bar, composed, line, pie, donut, radar, radial bar, sparkline): axe finds
 *          nothing in light and dark, English and Arabic; every plot is an image named by its label with the same
 *          numbers in a captioned data table; series paint with the theme's chart colours at 3:1 or more against the
 *          card in both schemes (WCAG 1.4.11, which axe does not check on SVG); the category axis runs right to left in
 *          Arabic with Arabic-Indic digits when asked; the keyboard opens the tooltip; and the range toggle redraws the
 *          interactive area chart.
 * Boundary: the production build under `vite preview`; Chromium only; reduced motion, so Recharts draws at once.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.1.1, 1.4.11, 2.1.1 and 2.3.3; ADR 0182 (test tiers);
 *          ADR 0022 (test placement); STA-1371.
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

import { example } from "../support/example.function";
import { SCHEMES } from "../support/schemes.constant";
import { visit } from "../support/visit.function";

const CHARTS = [
  "area-chart",
  "bar-chart",
  "composed-chart",
  "line-chart",
  "pie-chart",
  "donut-chart",
  "radar-chart",
  "radial-bar-chart",
  "sparkline",
] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
/** The examples on a page, without the RTL and brand copies further down. */
const EXAMPLES = "section#usage, section[id^='example-']";

/**
 * Axe over the whole page, every rule and tag as elsewhere. Text inside a chart's SVG is left out: axe stops at the
 * <svg> in the background stack and reports "contains an image node" for every tick, so it cannot measure it; the
 * contrast of that text is measured below instead, as the progress circle suite does for its SVG arcs.
 */
async function expectNoAxeFindings(page: Page): Promise<void> {
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
  const { violations, incomplete } = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .exclude("[data-slot=chart] svg text")
    .analyze();
  const report = (results: typeof violations) =>
    results.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
  expect(report(violations), "axe violations").toEqual([]);
  expect(report(incomplete), "axe checks left for review").toEqual([]);
}

/** A computed colour as `#rrggbb`, drawn on a canvas so any CSS colour form (oklch, `var()`) reads. */
const painted = (locator: Locator, property: "backgroundColor" | "fill" | "color" | "stopColor") =>
  locator.evaluate((element, name) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = getComputedStyle(element)[name];
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, property);

for (const slug of CHARTS)
  for (const scheme of SCHEMES)
    for (const locale of LOCALES)
      test(`axe finds nothing on /${slug} in ${scheme}, ${locale}`, async ({ page }) => {
        await visit(page, `/${slug}`, scheme, locale);
        await expectNoAxeFindings(page);
      });

for (const slug of CHARTS.filter((name) => name !== "sparkline"))
  test(`every ${slug} plot is a named image with its numbers in a table`, async ({ page }) => {
    await visit(page, `/${slug}`, "light");
    // A plot with a brush is a named group, since the brush's sliders sit inside it (axe nested-interactive).
    const plots = page
      .locator(EXAMPLES)
      .locator("[data-slot=chart] svg:is([role=img], [role=group])");
    const tables = page.locator(EXAMPLES).locator("[data-slot=chart-table]");
    await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
    await expect(plots.first()).toBeVisible();
    await expect(plots).toHaveCount(await tables.count());
    const count = await plots.count();
    expect(await tables.count()).toBe(count);
    for (let index = 0; index < count; index += 1) {
      const name = await plots.nth(index).getAttribute("aria-label");
      expect(name).toMatch(/\S/);
      await expect(tables.nth(index).locator("caption")).toHaveText(name ?? "");
      expect(await tables.nth(index).locator("tbody tr").count()).toBeGreaterThan(0);
    }
  });

test("a sparkline speaks its label and values", async ({ page }) => {
  await visit(page, "/sparkline", "light");
  await expect(
    page.getByRole("img", { name: /^Revenue, last 12 weeks, line: 12, 14/ }),
  ).toBeVisible();
});

for (const scheme of SCHEMES)
  test(`the series paint the chart set at 3:1 against the card in ${scheme}`, async ({ page }) => {
    await visit(page, "/bar-chart", scheme);
    const card = example(page, "usage").locator("[data-slot=card]").first();
    const background = await painted(card, "backgroundColor");
    const bars = example(page, "usage").locator(".recharts-bar-rectangle path");
    await expect(bars.first()).toBeVisible();
    // A column is lit from the top: its fill points at a gradient, so a series is measured at each of its stops.
    const fills = new Map<string, string[]>();
    for (let index = 0; index < (await bars.count()); index += 1) {
      const bar = bars.nth(index);
      const fill = await bar.evaluate((element) => getComputedStyle(element).fill);
      const gradient = /url\("?#([^")]+)"?\)/.exec(fill)?.[1];
      const stops = gradient ? await page.locator(`[id="${gradient}"] stop`).all() : [];
      fills.set(
        fill,
        gradient
          ? await Promise.all(stops.map((stop) => painted(stop, "stopColor")))
          : [await painted(bar, "fill")],
      );
    }
    expect(fills.size).toBe(2);
    for (const [fill, colors] of fills)
      for (const color of colors)
        expect(contrastRatio(color, background), `${fill} ${color}`).toBeGreaterThanOrEqual(3);
  });

for (const scheme of SCHEMES)
  test(`all five accent steps stand 3:1 against the card in ${scheme}`, async ({ page }) => {
    await visit(page, "/donut-chart", scheme);
    const usage = example(page, "usage");
    const background = await painted(usage.locator("[data-slot=card]").first(), "backgroundColor");
    const slices = usage.locator("path.recharts-sector");
    await expect(slices).toHaveCount(5);
    const failures: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const fill = await painted(slices.nth(index), "fill");
      const ratio = contrastRatio(fill, background);
      if (ratio < 3) failures.push(`step ${index + 1} ${fill} ${ratio.toFixed(2)}`);
    }
    expect(failures, `accent steps under 3:1 in ${scheme}`).toEqual([]);
  });

for (const scheme of SCHEMES)
  test(`axis and centre text stand 4.5:1 against the card in ${scheme}`, async ({ page }) => {
    for (const slug of ["area-chart", "composed-chart", "donut-chart", "radar-chart"]) {
      await visit(page, `/${slug}`, scheme);
      const usage = example(page, "usage");
      const background = await painted(
        usage.locator("[data-slot=card]").first(),
        "backgroundColor",
      );
      const texts = usage.locator("[data-slot=chart] svg text");
      await expect(texts.first()).toBeVisible();
      for (let index = 0; index < (await texts.count()); index += 1) {
        const text = texts.nth(index);
        const fill = await painted(text.locator("tspan").first(), "fill");
        expect(
          contrastRatio(fill, background),
          `${slug} ${await text.textContent()}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

test("the category axis runs right to left in Arabic, in Arabic-Indic digits when asked", async ({
  page,
}) => {
  const ticks = async (locale: "en" | "ar", query = "") => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`/area-chart?scheme=light&locale=${locale}${query}`);
    const labels = example(page, "usage").locator(
      ".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-label",
    );
    await expect(labels.first()).toBeVisible();
    const first = await labels.first().boundingBox();
    const last = await labels.last().boundingBox();
    return { first: first?.x ?? 0, last: last?.x ?? 0, text: await labels.first().textContent() };
  };
  const english = await ticks("en");
  expect(english.first).toBeLessThan(english.last);
  const arabic = await ticks("ar", "&numerals=arab");
  expect(arabic.first).toBeGreaterThan(arabic.last);
  expect(arabic.text).toMatch(/[٠-٩]/u);
});

test("the keyboard opens the tooltip and the range toggle redraws the chart", async ({ page }) => {
  await visit(page, "/area-chart", "light");
  const usage = example(page, "usage");
  // The 90-day range shows the brush, so the plot is a named group until the range toggle drops it.
  const plot = usage.locator("svg:is([role=img], [role=group])");
  const rows = usage.locator("[data-slot=chart-table] tbody tr");
  await expect(rows).toHaveCount(90);
  await plot.focus();
  await page.keyboard.press("ArrowRight");
  await expect(usage.locator("[data-slot=chart-tooltip]")).toBeVisible();
  await usage.getByRole("radio", { name: "7 days" }).click();
  await expect(rows).toHaveCount(7);
});
