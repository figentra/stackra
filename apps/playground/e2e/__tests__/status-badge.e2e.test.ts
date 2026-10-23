/**
 * Stackra file contract:
 * Purpose: the status-badge route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every badge's text is its state alone and none is a live region;
 *          each dot is 6 by 6 px and paints its tone's theme colour; the dot sits on the reading-start side in both
 *          directions; and the live badge moves to the next state.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 4); WCAG 2.2 SC 1.4.1; ADR 0182 (test tiers);
 *          ADR 0022 (test placement).
 */
// @covers sta-350:FR-036 sta-350:P-024 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The state text of each tone on the page and the theme variable its dot is drawn in. */
const STATES = [
  { text: "Draft", role: "muted" },
  { text: "Scheduled", role: "accent" },
  { text: "Active", role: "success" },
  { text: "Pending", role: "warning" },
  { text: "Failed", role: "danger" },
] as const;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/status-badge?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Status badge" })).toBeVisible();
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

/** What a theme variable paints as a background, read from a probe element that is removed again. */
const paintedVariable = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(--${variable})`;
    document.body.append(probe);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(probe).backgroundColor;
    probe.remove();
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, name);

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the status-badge page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every badge reads as its state alone and none is a live region", async ({ page }) => {
  await open(page, "light", "en");
  const badges = page
    .getByRole("main")
    .locator('[data-slot="chip"]')
    .filter({ has: page.locator('[data-slot="status-badge-dot"]') });
  // Five tones in three sizes, four records and the live sample.
  await expect(badges).toHaveCount(15 + 4 + 1);
  for (const badge of await badges.all()) {
    await expect(badge).toHaveText(/^(Draft|Scheduled|Active|Pending|Failed)$/);
    await expect(badge.locator('[role="status"], [aria-live]')).toHaveCount(0);
  }
  await expect(page.getByRole("main").locator('[role="status"], [aria-live]')).toHaveCount(0);
});

for (const scheme of SCHEMES)
  test(`each dot is 6 by 6 px and paints its tone's theme colour in ${scheme}`, async ({
    page,
  }) => {
    await open(page, scheme, "en");
    const medium = page
      .getByRole("region", { name: "Tones and sizes" })
      .locator("ul")
      .nth(1)
      .locator('[data-slot="status-badge-dot"]');
    await expect(medium).toHaveCount(STATES.length);
    for (const [index, state] of STATES.entries()) {
      const dot = medium.nth(index);
      const box = await dot.boundingBox();
      if (!box) throw new Error("a dot has no box");
      expect([Math.round(box.width), Math.round(box.height)], state.text).toEqual([6, 6]);
      expect(await paintedBackground(dot), `${state.text} in ${scheme}`).toBe(
        await paintedVariable(page, state.role),
      );
    }
  });

for (const locale of LOCALES)
  test(`the dot sits on the reading-start side of the text in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const badge = page
      .getByRole("region", { name: "Tones and sizes" })
      .locator('[data-slot="chip"]')
      .first();
    const dot = await badge.locator('[data-slot="status-badge-dot"]').boundingBox();
    const text = await badge.locator(".chip__label").boundingBox();
    if (!dot || !text) throw new Error("a box is missing");
    expect(dot.x < text.x, locale).toBe(locale === "en");
  });

test("the live badge moves to the next state and announces nothing", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByText("Draft")).toBeVisible();
  await live.getByRole("button", { name: "Next state" }).click();
  await expect(live.getByText("Scheduled")).toBeVisible();
  await expect(live.locator('[role="status"], [aria-live]')).toHaveCount(0);
});
