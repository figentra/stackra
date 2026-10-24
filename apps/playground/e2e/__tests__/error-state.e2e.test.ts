/**
 * Stackra file contract:
 * Purpose: the error state route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, also in the live sample's failed and recovered states; every kind is an
 *          assertive alert with a level-3 heading and a decorative 24 px icon centred above it in both directions; the
 *          error's message is shown and its stack is not in the production build; every action reaches 24 px; and the
 *          live sample fails, loads, recovers and breaks again from the keyboard with focus moved to its region on
 *          each change.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay, and none opens here, so role queries work throughout.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decisions 1 and 6); ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-151 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/error-state?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Error state" })).toBeVisible();
};

/** Runs axe over the page and expects neither violations nor checks left for review. */
const expectAxeClean = async (page: Page) => {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    violations.map((finding) => finding.id),
    "axe violations",
  ).toEqual([]);
  expect(
    incomplete.map((finding) => finding.id),
    "axe checks left for review",
  ).toEqual([]);
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the error state page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing with the live sample recovered in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const live = page.getByRole("region", { name: "Try it" });
      await live.getByRole("button", { name: "Try again" }).click();
      await expect(live.getByRole("heading", { level: 3, name: "Orders loaded" })).toBeVisible();
      await expectAxeClean(page);
    });
  }

test("every kind is an assertive alert with a level-3 heading, and none skips an outline level", async ({
  page,
}) => {
  await open(page, "light", "en");
  const kinds = page.getByRole("region", { name: "Kinds" });
  const alerts = kinds.getByRole("alert");
  await expect(alerts).toHaveCount(4);
  for (const alert of await alerts.all())
    await expect(alert).toHaveAttribute("aria-live", "assertive");
  for (const name of [
    "Sign in to continue",
    "You do not have access",
    "We could not find that page",
    "Something went wrong",
  ])
    await expect(kinds.getByRole("heading", { level: 3, name })).toBeVisible();
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`every icon is 24 px, decorative and centred above its title in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const states = page.getByRole("main").locator("[data-kind]");
    await expect(states).toHaveCount(4 + 4 + 1);
    for (const state of await states.all()) {
      const well = state.locator('[data-slot="state-icon"]');
      if ((await well.count()) === 0) continue;
      const icon = well.locator("svg");
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      const iconBox = await icon.boundingBox();
      const wellBox = await well.boundingBox();
      const rootBox = await state.boundingBox();
      const titleBox = await state.getByRole("heading").boundingBox();
      if (!iconBox || !wellBox || !rootBox || !titleBox) throw new Error("a box is missing");
      expect([Math.round(iconBox.width), Math.round(iconBox.height)]).toEqual([24, 24]);
      expect(wellBox.y + wellBox.height).toBeLessThanOrEqual(titleBox.y);
      const rootCentre = rootBox.x + rootBox.width / 2;
      expect(Math.abs(wellBox.x + wellBox.width / 2 - rootCentre), locale).toBeLessThanOrEqual(1.5);
    }
  });

test("the error's message is shown, and its stack is not in the production build", async ({
  page,
}) => {
  await open(page, "light", "en");
  const details = page.locator('[data-slot="error-state-details"]').first();
  await expect(details).toContainText("The order service did not answer in time");
  await expect(page.locator("pre")).toHaveCount(0);
});

test("every action reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = page.getByRole("main").locator("[data-kind]").getByRole("button");
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    if (!box) throw new Error("a button has no box");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the retry order is the retry button first, then the further action", async ({ page }) => {
  await open(page, "light", "en");
  const state = page
    .getByRole("region", { name: "Parts" })
    .locator("[data-kind]")
    .filter({ hasText: "Contact support" });
  await expect(state.getByRole("button")).toHaveText(["Try again", "Contact support"]);
});

test("the live sample fails, loads, recovers and breaks again from the keyboard, moving focus to its region", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const demo = live.getByRole("group", { name: "Orders demo" });
  await expect(demo.getByRole("alert")).toContainText("Something went wrong");

  await demo.getByRole("button", { name: "Try again" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.getByRole("status")).toHaveText("Loading orders");
  await expect(demo.getByRole("alert")).toHaveCount(0);
  await expect(demo).toBeFocused();

  await expect(demo.getByRole("heading", { level: 3, name: "Orders loaded" })).toBeVisible();
  await expect(demo).toBeFocused();

  await demo.getByRole("button", { name: "Break it again" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.getByRole("alert")).toContainText("Something went wrong");
  await expect(demo).toBeFocused();
});
