/**
 * Stackra file contract:
 * Purpose: the chip route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; the text of every variant, tone and size stands 4.5:1 on its chip (the
 *          pairs the theme does not measure, read from painted colours so `color-mix` backgrounds count); an icon is
 *          the size of its chip's text; the start icon sits on the reading-start side in both directions; and the
 *          live chip follows its buttons.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 3); WCAG 2.2 SC 1.4.3; ADR 0182 (test tiers);
 *          ADR 0022 (test placement).
 */
// @covers sta-350:FR-036 sta-350:P-023 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/chip?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Chip" })).toBeVisible();
};

/**
 * A computed colour as `#rrggbb`, composited over `base` when it is not opaque: drawn on a canvas, so any CSS colour
 * form (oklch, `color-mix`) reads, and a tinted background counts as what the eye sees on the page.
 */
const paintedOver = (locator: Locator, property: "color" | "backgroundColor", base: string) =>
  locator.evaluate(
    (element, { name, under }) => {
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no 2d canvas");
      context.fillStyle = under;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = getComputedStyle(element)[name];
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    },
    { name: property, under: base },
  );

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the chip page in ${scheme}, ${locale}`, async ({ page }) => {
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

for (const scheme of SCHEMES)
  test(`the text of every chip stands 4.5:1 on its chip in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const pageBackground = await paintedOver(page.locator("body"), "backgroundColor", "#ffffff");
    const chips = page
      .getByRole("region", { name: "Variants and tones" })
      .locator('[data-slot="chip"]');
    const count = await chips.count();
    expect(count).toBe(60);
    const failures: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const chip = chips.nth(index);
      const label = chip.locator(".chip__label");
      // A transparent chip (tertiary) is measured on the page, a tinted one on the page it is drawn over.
      const background = await paintedOver(chip, "backgroundColor", pageBackground);
      const text = await paintedOver(label, "color", background);
      const ratio = contrastRatio(text, background);
      if (ratio < 4.5) {
        const classes = await chip.getAttribute("class");
        failures.push(
          `${classes?.match(/chip--(?!md|sm|lg)\S+/g)?.join(" ")} ${await label.textContent()} ${ratio.toFixed(2)}`,
        );
      }
    }
    expect(failures, `chips under 4.5:1 in ${scheme}: variant, tone, ratio`).toEqual([]);
  });

test("an icon is the size of its chip's text", async ({ page }) => {
  await open(page, "light", "en");
  const chips = page.getByRole("region", { name: "Icons" }).locator('[data-slot="chip"]');
  for (const index of [0, 2]) {
    const chip = chips.nth(index);
    const fontSize = await chip.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    for (const svg of await chip.locator("svg").all()) {
      const box = await svg.boundingBox();
      if (!box) throw new Error("an icon has no box");
      expect(box.width, `chip ${index}`).toBeCloseTo(fontSize, 0);
      expect(box.height, `chip ${index}`).toBeCloseTo(fontSize, 0);
    }
  }
});

for (const locale of LOCALES)
  test(`the start icon sits on the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const chip = page.getByRole("region", { name: "Icons" }).locator('[data-slot="chip"]').first();
    const icon = await chip.locator("svg").boundingBox();
    const label = await chip.locator(".chip__label").boundingBox();
    if (!icon || !label) throw new Error("a box is missing");
    expect(icon.x < label.x, locale).toBe(locale === "en");
  });

test("the live chip follows its buttons", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByText("primary, default")).toBeVisible();
  await live.getByRole("button", { name: "Next variant" }).click();
  await live.getByRole("button", { name: "Next tone" }).click();
  await expect(live.getByText("secondary, accent")).toBeVisible();
  await expect(live.locator('[data-slot="chip"]')).toHaveClass(/chip--accent/);
});
