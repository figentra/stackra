/**
 * Stackra file contract:
 * Purpose: the progress bar route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every bar is a named progressbar, the determinate ones with their value and
 *          text and the indeterminate one without; the three sizes draw dots 4, 8 and 12 px thick; every tone's filled
 *          dots take the tone and stand 3:1 from the page in light and dark (WCAG 1.4.11), the accent's leading dot in
 *          the theme's core; a value fills its share of the dots from the inline start in both directions; an
 *          indeterminate bar builds its dots only without reduced motion and rests fully lit with it, while a value is
 *          drawn at once either way (STA-2017's dot loader); and the advance-and-reset example works from the
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
const SIZES = { sm: 4, md: 8, lg: 12 } as const;
const TONES = ["default", "accent", "success", "warning", "danger"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion });
  await page.goto(`/progress-bar?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Progress bar", locale) }),
  ).toBeVisible();
};

/** A computed colour as `#rrggbb`, drawn on a canvas so any CSS colour form (oklch, `color-mix`) reads. */
const painted = (locator: Locator, property: "color" | "backgroundColor") =>
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

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return box;
};

/** The dots of a bar, lit or not. */
const dotsOf = (bar: Locator) => bar.locator('[data-slot="dot"]');
const litOf = (bar: Locator) => bar.locator('[data-slot="dot"][data-lit]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the progress bar page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every bar is a progressbar with an accessible name", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
  // The examples' fifteen, and the knobs playground's own bar once it has mounted with its label.
  const bars = page.getByRole("progressbar");
  const count = await bars.count();
  expect(count).toBeGreaterThanOrEqual(15);
  for (let index = 0; index < count; index += 1)
    await expect(bars.nth(index)).toHaveAccessibleName(/\S/);
});

test("determinate bars carry their value and text, and the indeterminate one carries neither", async ({
  page,
}) => {
  await open(page, "light", "en");
  const determinate = page.getByRole("region", { name: "Determinate" });
  for (const step of [0, 40, 100]) {
    const bar = determinate.getByRole("progressbar", { name: `Upload at ${step} per cent` });
    await expect(bar).toHaveAttribute("aria-valuenow", String(step));
    await expect(bar).toHaveAttribute("aria-valuetext", `${step}%`);
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
  }
  const indeterminate = page
    .getByRole("region", { name: "Indeterminate" })
    .getByRole("progressbar", { name: "Preparing upload" });
  await expect(indeterminate).not.toHaveAttribute("aria-valuenow");
  await expect(indeterminate).not.toHaveAttribute("aria-valuetext");
});

test("a visible label names the bar and the value text is shown and spoken", async ({ page }) => {
  await open(page, "light", "en");
  const text = page.getByRole("region", { name: "Label and value" });
  const storage = text.getByRole("progressbar", { name: "Storage used" });
  await expect(storage.locator('[data-slot="label"]')).toHaveText("Storage used");
  await expect(storage.locator(".progress-bar__output")).toHaveText("72%");
  const files = text.getByRole("progressbar", { name: "Uploading invoices" });
  await expect(files).toHaveAttribute("aria-valuetext", "3 of 12 files");
  await expect(files).toHaveAttribute("aria-valuemax", "12");
  await expect(files.locator(".progress-bar__output")).toHaveText("3 of 12 files");
});

test("the three sizes draw dots 4, 8 and 12 px thick", async ({ page }) => {
  await open(page, "light", "en");
  for (const [size, pixels] of Object.entries(SIZES)) {
    const box = await boxOf(dotsOf(page.locator(`section#usage [data-size="${size}"]`)).first());
    expect(box.height, size).toBeCloseTo(pixels, 0);
  }
});

for (const scheme of SCHEMES)
  test(`every tone's fill stands 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const background = await painted(page.locator("body"), "backgroundColor");
    const failures: string[] = [];
    for (const tone of TONES) {
      const bar = page.locator(`[data-tone="${tone}"]`);
      // The first lit dot is the inline-start one, which takes the tone even where the leading dot is the core.
      const dot = litOf(bar).first();
      const color = await painted(dot, "backgroundColor");
      expect(color, tone).toBe(
        await paintedValue(dot, `var(--${tone === "default" ? "foreground" : tone})`),
      );
      const ratio = contrastRatio(color, background);
      if (ratio < 3) failures.push(`${tone} ${ratio.toFixed(2)}`);
    }
    expect(failures, `tones under 3:1 in ${scheme}: tone, ratio`).toEqual([]);
  });

test("the accent bar's leading dot is the theme's core, or its accent without one", async ({
  page,
}) => {
  await open(page, "light", "en");
  // 60 of 100 over a medium bar's 16 dots lights 10; the tenth leads.
  const leading = litOf(page.locator('[data-tone="accent"]')).nth(9);
  expect(await painted(leading, "backgroundColor")).toBe(
    await paintedValue(leading, "var(--core, var(--accent))"),
  );
});

for (const locale of LOCALES)
  test(`a value fills its share of the dots from the inline start in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const bar = page.locator('[data-value="40"]');
    // A medium bar has 16 dots; 40 per cent rounds 6.4 up to 7.
    await expect(dotsOf(bar)).toHaveCount(16);
    await expect(litOf(bar)).toHaveCount(7);
    const dots = await dotsOf(bar).evaluateAll((nodes) =>
      nodes.map((node) => ({
        isLit: node.hasAttribute("data-lit"),
        x: node.getBoundingClientRect().x,
      })),
    );
    const lit = dots.filter((dot) => dot.isLit).map((dot) => dot.x);
    const unlit = dots.filter((dot) => !dot.isLit).map((dot) => dot.x);
    if (locale === "en") expect(Math.max(...lit)).toBeLessThan(Math.min(...unlit));
    else expect(Math.min(...lit)).toBeGreaterThan(Math.max(...unlit));
  });

test("the indeterminate bar builds its dots, and rests fully lit under reduced motion", async ({
  page,
}) => {
  const lit = () => litOf(page.locator("[data-indeterminate]")).count();
  await open(page, "light", "en", "reduce");
  expect(await lit()).toBe(16);
  await open(page, "light", "en", "no-preference");
  const first = await lit();
  // Polled across a whole 1840 ms loop of 16 dots, since the 400 ms hold can repeat a count.
  await expect.poll(lit, { timeout: 2100 }).not.toBe(first);
});

test("a determinate bar draws its value at once, with or without reduced motion", async ({
  page,
}) => {
  // The dots step in whole dots with no tween (STA-2017), so there is nothing to ease or turn off.
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    await open(page, "light", "en", reducedMotion);
    await expect(litOf(page.locator('[data-value="40"]')), reducedMotion).toHaveCount(7);
  }
});

test("the example advances from the keyboard, updates the value and announces the end", async ({
  page,
}) => {
  await open(page, "light", "en");
  const region = page.getByRole("region", { name: "Advance and reset" });
  const bar = region.getByRole("progressbar", { name: "Upload progress" });
  const advance = region.getByRole("button", { name: "Advance by 10%" });
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await advance.focus();
  await page.keyboard.press("Enter");
  await expect(bar).toHaveAttribute("aria-valuenow", "10");
  await expect(bar).toHaveAttribute("aria-valuetext", "10%");
  await expect(advance).toBeFocused();
  for (let press = 0; press < 9; press += 1) await page.keyboard.press("Space");
  await expect(bar).toHaveAttribute("aria-valuenow", "100");
  await expect(region.locator("output")).toHaveText("Upload complete");
  await region.getByRole("button", { name: "Reset" }).click();
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await expect(region.locator("output")).toHaveText("");
});
