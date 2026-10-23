/**
 * Stackra file contract:
 * Purpose: the spinner route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; labelled spinners are named statuses and the decorative one is hidden; the
 *          three sizes are 16, 24 and 32 px; every tone stands 3:1 from the page in light and dark (WCAG 1.4.11, which
 *          axe does not check on SVG); a spinner stands still under reduced motion and runs otherwise; the start-and-
 *          stop example announces its result; and a spinner never mirrors.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; WCAG 2.2 SC 1.4.11 and 2.3.3; ADR 0182 (test tiers); ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-046 sta-350:P-032 sta-350:SC-002 sta-350:SC-006
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const SIZES = { sm: 16, md: 24, lg: 32 } as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion });
  await page.goto(`/spinner?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Spinner" })).toBeVisible();
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

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the spinner page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("labelled spinners are named statuses and the one beside text is hidden", async ({ page }) => {
  await open(page, "light", "en");
  const labelled = page
    .getByRole("region", { name: "Sizes" })
    .getByRole("status")
    .or(page.getByRole("region", { name: "Tones" }).getByRole("status"));
  await expect(labelled).toHaveCount(Object.keys(SIZES).length + 6);
  for (const name of await labelled.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-label")),
  ))
    expect(name).not.toBe("Loading");
  await expect(page.getByRole("region", { name: "Beside text" }).getByRole("status")).toHaveCount(
    0,
  );
});

test("the three sizes are 16, 24 and 32 px square", async ({ page }) => {
  await open(page, "light", "en");
  for (const [size, pixels] of Object.entries(SIZES)) {
    const box = await page.locator(`[data-size="${size}"]`).boundingBox();
    if (!box) throw new Error(`no box for ${size}`);
    expect(box.width, size).toBeCloseTo(pixels, 0);
    expect(box.height, size).toBeCloseTo(pixels, 0);
  }
});

for (const scheme of SCHEMES)
  test(`every tone stands 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const background = await painted(page.locator("body"), "backgroundColor");
    const failures: string[] = [];
    const tones = page.locator("[data-tone]");
    for (let index = 0; index < (await tones.count()); index += 1) {
      const tone = tones.nth(index);
      const ratio = contrastRatio(await painted(tone, "color"), background);
      if (ratio < 3) failures.push(`${await tone.getAttribute("data-tone")} ${ratio.toFixed(2)}`);
    }
    expect(failures, `tones under 3:1 in ${scheme}: tone, ratio`).toEqual([]);
  });

test("a spinner stands still under reduced motion and runs otherwise", async ({ page }) => {
  const animationNames = () =>
    page
      .locator(".spinner")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
  await open(page, "light", "en", "reduce");
  expect((await animationNames()).every((name) => name === "none")).toBe(true);
  await open(page, "light", "en", "no-preference");
  expect((await animationNames()).every((name) => name !== "none")).toBe(true);
});

test("the start-and-stop example shows its status and then announces the result", async ({
  page,
}) => {
  await open(page, "light", "en");
  const region = page.getByRole("region", { name: "Start and stop" });
  await region.getByRole("button", { name: "Load orders" }).click();
  await expect(region.getByRole("status", { name: "Loading orders" })).toBeVisible();
  await expect(region.locator("output")).toHaveText("Orders loaded");
  await expect(region.getByRole("status", { name: "Loading orders" })).toHaveCount(0);
});

test("a spinner never mirrors in right-to-left", async ({ page }) => {
  const transform = async (locale: string) => {
    await open(page, "light", locale);
    return page.locator('[data-size="md"]').evaluate((node) => getComputedStyle(node).transform);
  };
  expect(await transform("ar")).toBe(await transform("en"));
});
