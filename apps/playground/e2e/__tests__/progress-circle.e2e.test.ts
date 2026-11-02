/**
 * Stackra file contract:
 * Purpose: the progress circle route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every ring is a named progressbar, the determinate ones with their
 *          value and text and the indeterminate one without; the three sizes draw a 3×3 cell of dots 20, 28 and 36 px
 *          across; every tone's filled dots take the tone and stand 3:1 from the page in light and dark (WCAG 1.4.11),
 *          the accent's leading dot in the theme's core; a value fills its share of the nine dots in floor order, each
 *          row from the inline start in both directions; an indeterminate cell builds its dots only without reduced
 *          motion and rests fully lit with it (STA-2017's dot loader); and the advance-and-reset example works from the
 *          keyboard, updates the value and announces its completion.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312; WCAG 2.2 SC 1.4.11, 2.3.3 and 4.1.2; ADR 0182 (test tiers);
 *          ADR 0022 (test placement).
 */
// @covers sta-350:FR-120 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const SIZES = { sm: 20, md: 28, lg: 36 } as const;
const TONES = ["default", "accent", "success", "warning", "danger"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion });
  await page.goto(`/progress-circle?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Progress circle", locale) }),
  ).toBeVisible();
};

/** A computed colour as `#rrggbb`, drawn on a canvas so any CSS colour form (oklch, `color-mix`) reads. */
const painted = (locator: Locator, property: "backgroundColor") =>
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

/** A CSS colour value (a theme variable, say) resolved where `locator` sits, then painted as `#rrggbb`. */
const paintedValue = (locator: Locator, value: string) =>
  locator.evaluate((element, css) => {
    const probe = document.createElement("span");
    probe.style.color = css;
    element.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = resolved;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, value);

/** The dots of a ring's cell, lit or not. */
const dotsOf = (ring: Locator) => ring.locator('[data-slot="dot"]');
const litOf = (ring: Locator) => ring.locator('[data-slot="dot"][data-lit]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the progress circle page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(
        violations.map((finding) => finding.id),
        "axe violations",
      ).toEqual([]);
      expect(
        incomplete.map((finding) => finding.id),
        "axe checks left for review",
      ).toEqual([]);
    });

test("every ring is a progressbar with an accessible name", async ({ page }) => {
  await open(page, "light", "en");
  const rings = page.getByRole("progressbar");
  await expect(rings).toHaveCount(16);
  for (let index = 0; index < 16; index += 1)
    await expect(rings.nth(index)).toHaveAccessibleName(/\S/);
});

test("determinate rings carry their value and text, and the indeterminate one carries neither", async ({
  page,
}) => {
  await open(page, "light", "en");
  const determinate = page.getByRole("region", { name: "Determinate" });
  for (const step of [0, 25, 50, 75, 100]) {
    const ring = determinate.getByRole("progressbar", { name: `Sync at ${step} per cent` });
    await expect(ring).toHaveAttribute("aria-valuenow", String(step));
    await expect(ring).toHaveAttribute("aria-valuetext", `${step}%`);
  }
  const indeterminate = page
    .getByRole("region", { name: "Indeterminate" })
    .getByRole("progressbar", { name: "Preparing sync" });
  await expect(indeterminate).not.toHaveAttribute("aria-valuenow");
  await expect(indeterminate).not.toHaveAttribute("aria-valuetext");
});

test("a ring draws no text of its own", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.locator('section#usage [data-size="md"]')).toHaveText("");
});

test("the three sizes draw a cell 20, 28 and 36 px across", async ({ page }) => {
  await open(page, "light", "en");
  for (const [size, pixels] of Object.entries(SIZES)) {
    const box = await page
      .locator(`section#usage [data-size="${size}"] [data-slot="dot-grid"]`)
      .boundingBox();
    if (!box) throw new Error(`no box for ${size}`);
    expect(box.width, size).toBeCloseTo(pixels, 0);
    expect(box.height, size).toBeCloseTo(pixels, 0);
  }
});

for (const scheme of SCHEMES)
  test(`every tone's dots stand 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const background = await painted(page.locator("body"), "backgroundColor");
    const failures: string[] = [];
    for (const tone of TONES) {
      // 60 per cent lights six of nine; the first lit in document order is the middle row's start, not the leading
      // dot, so it takes the tone even where the leading dot is the core.
      const dot = litOf(page.locator(`[data-tone="${tone}"]`)).first();
      const color = await painted(dot, "backgroundColor");
      expect(color, tone).toBe(
        await paintedValue(dot, `var(--${tone === "default" ? "foreground" : tone})`),
      );
      const ratio = contrastRatio(color, background);
      if (ratio < 3) failures.push(`${tone} ${ratio.toFixed(2)}`);
    }
    expect(failures, `tones under 3:1 in ${scheme}: tone, ratio`).toEqual([]);
  });

test("the accent ring's leading dot is the theme's core, or its accent without one", async ({
  page,
}) => {
  await open(page, "light", "en");
  // At 60 the sixth dot in floor order leads: the middle row's inline end, the third lit in document order.
  const leading = litOf(page.locator('[data-tone="accent"]')).nth(2);
  expect(await painted(leading, "backgroundColor")).toBe(
    await paintedValue(leading, "var(--core, var(--accent))"),
  );
});

test("a value fills its share of the nine dots", async ({ page }) => {
  await open(page, "light", "en");
  // Each value rounds up to whole dots of nine: 25 lights 3, 75 lights 7.
  for (const [step, lit] of [
    [0, 0],
    [25, 3],
    [50, 5],
    [75, 7],
    [100, 9],
  ] as const) {
    const ring = page.locator(`[data-value="${step}"]`);
    await expect(dotsOf(ring), `${step}%`).toHaveCount(9);
    await expect(litOf(ring), `${step}%`).toHaveCount(lit);
  }
});

test("the indeterminate cell builds its dots, and rests fully lit under reduced motion", async ({
  page,
}) => {
  const lit = () => litOf(page.locator("[data-indeterminate]")).count();
  await open(page, "light", "en", "reduce");
  expect(await lit()).toBe(9);
  await open(page, "light", "en", "no-preference");
  const first = await lit();
  // Polled across a whole 1280 ms loop, since the 400 ms hold can repeat a count.
  await expect.poll(lit, { timeout: 1500 }).not.toBe(first);
});

for (const locale of LOCALES)
  test(`a row fills from the inline start in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // At 50 the bottom row is full and the middle row has two of three lit (STA-2017 FR-006).
    const middle = await dotsOf(page.locator('[data-value="50"]')).evaluateAll((nodes) =>
      nodes.slice(3, 6).map((node) => ({
        isLit: node.hasAttribute("data-lit"),
        x: node.getBoundingClientRect().x,
      })),
    );
    const lit = middle.filter((dot) => dot.isLit).map((dot) => dot.x);
    const unlit = middle.filter((dot) => !dot.isLit).map((dot) => dot.x);
    expect(lit).toHaveLength(2);
    if (locale === "en") expect(Math.max(...lit)).toBeLessThan(Math.min(...unlit));
    else expect(Math.min(...lit)).toBeGreaterThan(Math.max(...unlit));
  });

test("the example advances from the keyboard, updates the value and announces the end", async ({
  page,
}) => {
  await open(page, "light", "en");
  const region = page.getByRole("region", { name: "Advance and reset" });
  const ring = region.getByRole("progressbar", { name: "Sync progress" });
  const advance = region.getByRole("button", { name: "Advance by 10%" });
  await expect(ring).toHaveAttribute("aria-valuenow", "0");
  await advance.focus();
  await page.keyboard.press("Enter");
  await expect(ring).toHaveAttribute("aria-valuenow", "10");
  await expect(advance).toBeFocused();
  for (let press = 0; press < 9; press += 1) await page.keyboard.press("Space");
  await expect(ring).toHaveAttribute("aria-valuenow", "100");
  await expect(region.locator("output")).toHaveText("Sync complete");
  await region.getByRole("button", { name: "Reset" }).click();
  await expect(ring).toHaveAttribute("aria-valuenow", "0");
  await expect(region.locator("output")).toHaveText("");
});
