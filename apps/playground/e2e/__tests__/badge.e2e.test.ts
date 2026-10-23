/**
 * Stackra file contract:
 * Purpose: the badge route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each corner sits on the reading side of its anchor in both directions;
 *          unlabelled badges are hidden and labelled ones are spoken through their label; a press on a badge reaches
 *          the control under it; and every dot stands 3:1 from its anchor (WCAG 1.4.11).
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-040 sta-350:P-026 sta-350:P-027 sta-350:P-028 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The corners in page order, with the block side and the reading side each one is on. */
const CORNERS = [
  { name: "top-end", block: "above", side: "end" },
  { name: "top-start", block: "above", side: "start" },
  { name: "bottom-end", block: "below", side: "end" },
  { name: "bottom-start", block: "below", side: "start" },
] as const;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/badge?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Badge" })).toBeVisible();
};

/** A computed background as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const paintedBackground = (locator: Locator) =>
  locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });

/** The centre of an element's box. */
const centreOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("an element has no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the badge page in ${scheme}, ${locale}`, async ({ page }) => {
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

for (const locale of LOCALES)
  test(`each corner sits on the reading side of its anchor in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const items = page.getByRole("region", { name: "Corners" }).getByRole("listitem");
    await expect(items).toHaveCount(CORNERS.length);
    for (const [index, corner] of CORNERS.entries()) {
      const item = items.nth(index);
      const anchor = await centreOf(item.locator('[data-slot="badge-anchor"]'));
      const badge = await centreOf(item.locator('[data-slot="badge"]'));
      expect(badge.y < anchor.y, `${corner.name} ${corner.block}`).toBe(corner.block === "above");
      // `end` is the right in English and the left in Arabic; `start` the other way round.
      const isRight = badge.x > anchor.x;
      expect(isRight, `${corner.name} in ${locale}`).toBe(
        (corner.side === "end") === (locale === "en"),
      );
    }
  });

test("unlabelled badges are hidden and labelled ones are spoken through their label", async ({
  page,
}) => {
  await open(page, "light", "en");
  const badges = page.locator('[data-slot="badge"]');
  for (const badge of await badges.all()) {
    const hasLabel = (await badge.locator(".sr-only").count()) > 0;
    if (hasLabel) {
      await expect(badge).not.toHaveAttribute("aria-hidden", "true");
    } else {
      await expect(badge).toHaveAttribute("aria-hidden", "true");
    }
  }
  const labelled = page
    .getByRole("region", { name: "Variants and tones" })
    .getByText("danger soft: 5 new");
  await expect(labelled).toHaveClass(/sr-only/);
  await expect(page.getByRole("button", { name: "Notifications, 3 unread" })).toBeVisible();
});

test("a press on a badge reaches the control under it", async ({ page }) => {
  await open(page, "light", "en");
  const control = page.getByRole("region", { name: "On a control" });
  const badge = await centreOf(control.locator('[data-slot="badge"]'));
  await page.mouse.click(badge.x, badge.y);
  await expect(page.getByTestId("press-count")).toHaveText("Pressed 1 time.");
  await expect(control.getByRole("button", { name: "Notifications, 4 unread" })).toBeVisible();
});

for (const scheme of SCHEMES)
  test(`every dot stands 3:1 from its anchor in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const items = page.getByRole("region", { name: "Dots" }).getByRole("listitem");
    await expect(items).toHaveCount(3);
    for (const [index, name] of ["Online", "Away", "Busy"].entries()) {
      const item = items.nth(index);
      const dot = await paintedBackground(item.locator('[data-slot="badge"]'));
      const anchor = await paintedBackground(
        item.locator('[data-slot="badge-anchor"] > span').first(),
      );
      const ratio = contrastRatio(dot, anchor);
      expect(ratio, `${name} dot against its anchor in ${scheme}`).toBeGreaterThanOrEqual(3);
    }
  });
