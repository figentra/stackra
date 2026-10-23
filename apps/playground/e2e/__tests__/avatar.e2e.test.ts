/**
 * Stackra file contract:
 * Purpose: the avatar route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a loaded image is drawn and a broken one falls back to its initials; a
 *          labelled avatar is one named image and a decorative one is not in the accessibility tree; the initials of
 *          every tone and variant stand 4.5:1 on their background (axe does not check text inside `role="img"`); a
 *          square avatar is less round than a circle; and an Arabic name gives one letter.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; WCAG 2.2 SC 1.1.1 and 1.4.3; ADR 0182 (test tiers); ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-046 sta-350:P-031 sta-350:SC-002 sta-350:SC-006
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const TONES = ["default", "accent", "success", "warning", "danger"] as const;
const VARIANTS = ["default", "soft"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/avatar?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Avatar" })).toBeVisible();
};

/**
 * The text colour of an element and the background it is drawn on, as `#rrggbb`: every ancestor's background
 * painted over white on a canvas, so any CSS colour form (oklch, `color-mix`) reads and a tint counts as what the eye
 * sees.
 */
const visibleColours = (locator: Locator) =>
  locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    const paint = (colour: string) => {
      context.fillStyle = colour;
      context.fillRect(0, 0, 1, 1);
    };
    const read = () => {
      const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    };
    const chain: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node);
    paint("#ffffff");
    for (const node of chain) paint(getComputedStyle(node).backgroundColor);
    const background = read();
    paint(getComputedStyle(element).color);
    return { background, text: read() };
  });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the avatar page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("a loaded image is drawn and a broken one falls back to its initials", async ({ page }) => {
  await open(page, "light", "en");
  const loaded = page.locator('[data-sample="loaded"]');
  await expect(loaded.locator("img")).toBeVisible();
  expect(
    await loaded.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  const broken = page.locator('[data-sample="broken"]');
  await expect(broken.locator("img")).toHaveCount(0);
  await expect(broken).toHaveText("AL");
});

test("a labelled avatar is one named image and a list row's is out of the tree", async ({
  page,
}) => {
  await open(page, "light", "en");
  const region = page.getByRole("region", { name: "Accessible name" });
  await expect(region.getByRole("img", { name: "Ada Lovelace, administrator" })).toHaveCount(1);
  await expect(region.getByRole("img")).toHaveCount(1);
  const row = region.getByRole("listitem");
  await expect(row.getByRole("img")).toHaveCount(0);
  await expect(row).toHaveText("Ada LovelaceAdministrator");
});

for (const scheme of SCHEMES)
  test(`the initials of every tone and variant stand 4.5:1 in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const failures: string[] = [];
    for (const variant of VARIANTS)
      for (const tone of TONES) {
        const fallback = page
          .locator(`[data-variant="${variant}"][data-tone="${tone}"] .avatar__fallback`)
          .first();
        const { text, background } = await visibleColours(fallback);
        const ratio = contrastRatio(text, background);
        if (ratio < 4.5) failures.push(`${variant} ${tone} ${ratio.toFixed(2)}`);
      }
    expect(failures, `initials under 4.5:1 in ${scheme}: variant, tone, ratio`).toEqual([]);
  });

test("a square avatar is less round than a circle", async ({ page }) => {
  await open(page, "light", "en");
  const radiusShare = (shape: string) =>
    page
      .locator(`#avatar-sizes ~ div [data-shape="${shape}"][data-size="md"]`)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          Number.parseFloat(style.borderTopLeftRadius) / (element.getBoundingClientRect().width / 2)
        );
      });
  expect(await radiusShare("square")).toBeLessThan(1);
  expect(await radiusShare("circle")).toBeGreaterThanOrEqual(1);
});

test("an Arabic name gives one letter in right-to-left", async ({ page }) => {
  await open(page, "light", "ar");
  const names = page.locator('[data-sample="name"]');
  await expect(names.last()).toHaveText(/^.$/u);
});
