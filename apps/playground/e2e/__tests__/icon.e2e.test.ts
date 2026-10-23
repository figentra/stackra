/**
 * Stackra file contract:
 * Purpose: the icon route's own end-to-end checks: labelled icons are images with their names and decorative ones are
 *          hidden, directional icons are drawn mirrored only in right-to-left (and their shape really points the
 *          other way), and every tone sample stands 3:1 from the page background in light and dark (WCAG 1.4.11,
 *          which axe does not check on SVG strokes).
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 3); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-013 sta-350:FR-014 sta-350:FR-016 sta-350:P-013 sta-350:P-015
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const TONES = ["default", "muted", "accent", "success", "warning", "danger"];
const MIRRORED = ["Next", "Continue", "Send", "Undo"];
const NEVER_MIRRORED = ["Search", "Done", "Play"];

/** The labelled samples of the page, in page order: the tones, the one rated star, then the right-to-left ones. */
const LABELLED = [...TONES, "Rated", ...MIRRORED, ...NEVER_MIRRORED];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark" });
  await page.goto(`/icon?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Icon" })).toBeVisible();
};

/** A computed colour property as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const paintedColour = (locator: Locator, property: "color" | "backgroundColor") =>
  locator.evaluate((element, name) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element)[name];
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, property);

/** The computed `transform` of an icon, `none` or a matrix. */
const transformOf = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).transform);

/**
 * Whether the icon's drawn shape points to the left of its box: the middle of its first path (the tip of a chevron)
 * is taken through the element's full screen transform, so a dropped CSS transform fails even if the style says so.
 */
const pointsLeft = (locator: Locator) =>
  locator.evaluate((svg) => {
    const path = svg.querySelector("path");
    const matrix = path?.getScreenCTM();
    if (!path || !matrix) throw new Error("no path to measure");
    const tip = path.getPointAtLength(path.getTotalLength() / 2).matrixTransform(matrix);
    const box = svg.getBoundingClientRect();
    return tip.x < box.left + box.width / 2;
  });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`names the labelled icons and hides the decorative ones in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const names = await page
        .getByRole("img")
        .evaluateAll((images) => images.map((image) => image.getAttribute("aria-label")));
      expect(names).toEqual(LABELLED);
      for (const region of ["Sizes", "Decorative and labelled"]) {
        const decorative = page
          .getByRole("region", { name: region })
          .locator('svg:not([role="img"])');
        expect(await decorative.count(), region).toBeGreaterThan(0);
        for (const svg of await decorative.all())
          await expect(svg, region).toHaveAttribute("aria-hidden", "true");
      }
    });

test("mirrors the directional icons only in right-to-left", async ({ page }) => {
  await open(page, "light", "ar");
  for (const name of MIRRORED) {
    const icon = page.getByRole("img", { name, exact: true });
    expect(await transformOf(icon), name).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  }
  for (const name of NEVER_MIRRORED)
    expect(await transformOf(page.getByRole("img", { name, exact: true })), name).toBe("none");
  // The chevron points right when read left to right, so it must point left once mirrored.
  expect(await pointsLeft(page.getByRole("img", { name: "Next", exact: true }))).toBe(true);
  expect(await pointsLeft(page.getByRole("img", { name: "Search", exact: true }))).toBe(false);
});

test("mirrors nothing in left-to-right", async ({ page }) => {
  await open(page, "light", "en");
  for (const name of [...MIRRORED, ...NEVER_MIRRORED])
    expect(await transformOf(page.getByRole("img", { name, exact: true })), name).toBe("none");
  expect(await pointsLeft(page.getByRole("img", { name: "Next", exact: true }))).toBe(false);
});

for (const scheme of SCHEMES)
  test(`every tone sample stands 3:1 from the page background in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const background = await paintedColour(page.locator("body"), "backgroundColor");
    for (const tone of TONES) {
      const icon = page
        .getByRole("region", { name: "Tones" })
        .getByRole("img", { name: tone, exact: true });
      const ratio = contrastRatio(await paintedColour(icon, "color"), background);
      expect(ratio, `${tone} in ${scheme}`).toBeGreaterThanOrEqual(3);
    }
  });

test("the live icon changes size when its button is pressed", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByTestId("live-icon");
  await expect(live).toHaveAttribute("width", "20");
  await page.getByRole("button", { name: "Next size" }).click();
  await expect(live).toHaveAttribute("width", "24");
  await expect(page.getByRole("status")).toContainText("pressed 1 time");
});
