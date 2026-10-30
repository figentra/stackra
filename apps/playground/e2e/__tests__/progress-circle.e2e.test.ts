/**
 * Stackra file contract:
 * Purpose: the progress circle route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every ring is a named progressbar, the determinate ones with their
 *          value and text and the indeterminate one without; the three sizes are 20, 28 and 36 px across; every tone's
 *          arc stands 3:1 from the page in light and dark (WCAG 1.4.11, which axe does not check on SVG); an arc is as
 *          long as its value; an indeterminate ring spins only without reduced motion; the ring never mirrors; and the
 *          advance-and-reset example works from the keyboard, updates the value and announces its completion.
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

/** The circumference of HeroUI's ring: radius 16 in a 36-unit box. */
const CIRCUMFERENCE = 2 * Math.PI * 16;

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
const painted = (locator: Locator, property: "backgroundColor" | "stroke") =>
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

test("the three sizes are 20, 28 and 36 px across", async ({ page }) => {
  await open(page, "light", "en");
  for (const [size, pixels] of Object.entries(SIZES)) {
    const box = await page
      .locator(`section#usage [data-size="${size}"] .progress-circle__track`)
      .boundingBox();
    if (!box) throw new Error(`no box for ${size}`);
    expect(box.width, size).toBeCloseTo(pixels, 0);
    expect(box.height, size).toBeCloseTo(pixels, 0);
  }
});

for (const scheme of SCHEMES)
  test(`every tone's arc stands 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const background = await painted(page.locator("body"), "backgroundColor");
    const failures: string[] = [];
    for (const tone of TONES) {
      const arc = page.locator(`[data-tone="${tone}"] .progress-circle__fill-circle`);
      const ratio = contrastRatio(await painted(arc, "stroke"), background);
      if (ratio < 3) failures.push(`${tone} ${ratio.toFixed(2)}`);
    }
    expect(failures, `tones under 3:1 in ${scheme}: tone, ratio`).toEqual([]);
  });

test("an arc is as long as its value", async ({ page }) => {
  await open(page, "light", "en");
  for (const step of [0, 25, 50, 75, 100]) {
    const offset = await page
      .locator(`[data-value="${step}"] .progress-circle__fill-circle`)
      .getAttribute("stroke-dashoffset");
    expect(Number(offset), `${step}%`).toBeCloseTo(CIRCUMFERENCE * (1 - step / 100), 2);
  }
});

test("the indeterminate ring spins, and stands still under reduced motion", async ({ page }) => {
  const animationName = () =>
    page
      .locator("[data-indeterminate] .progress-circle__track")
      .evaluate((node) => getComputedStyle(node).animationName);
  await open(page, "light", "en", "reduce");
  expect(await animationName()).toBe("none");
  await open(page, "light", "en", "no-preference");
  expect(await animationName()).not.toBe("none");
});

test("a ring never mirrors in right-to-left", async ({ page }) => {
  const arc = async (locale: string) => {
    await open(page, "light", locale);
    const fill = page.locator('[data-value="25"] .progress-circle__fill-circle');
    return {
      transform: await fill.getAttribute("transform"),
      offset: await fill.getAttribute("stroke-dashoffset"),
    };
  };
  expect(await arc("ar")).toEqual(await arc("en"));
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
