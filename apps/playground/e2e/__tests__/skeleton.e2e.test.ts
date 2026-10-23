/**
 * Stackra file contract:
 * Purpose: the skeleton route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; under reduced motion no skeleton animates and otherwise shimmer and pulse
 *          run; the sweep runs reversed in right-to-left; a group draws one sweep over still tiles; the profile card
 *          cycles from content to a named placeholder and back while the button keeps focus; and bones are silent.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0304; WCAG 2.2 SC 2.3.3 and 4.1.3; ADR 0182 (test tiers); ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-045 sta-350:FR-046 sta-350:P-033 sta-350:SC-002 sta-350:SC-006
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion });
  await page.goto(`/skeleton?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Skeleton" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the skeleton page in ${scheme}, ${locale}`, async ({ page }) => {
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

/** The animation names of every shimmer and pulse element: its own and its two sweep pseudo-elements. */
const animationNames = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".skeleton--shimmer, .skeleton--pulse")].flatMap((node) =>
      [null, "::after", "::before"].map((pseudo) => ({
        pseudo,
        shimmer: node.classList.contains("skeleton--shimmer"),
        name: getComputedStyle(node, pseudo).animationName,
      })),
    ),
  );

test("no skeleton animates under reduced motion", async ({ page }) => {
  await open(page, "light", "en", "reduce");
  const names = await animationNames(page);
  expect(names.length).toBeGreaterThan(0);
  expect(names.filter(({ name }) => name !== "none")).toEqual([]);
});

test("a shimmer sweeps and a pulse pulses when motion is allowed", async ({ page }) => {
  await open(page, "light", "en", "no-preference");
  const bone = (animation: string) =>
    page.locator(`[data-animation="${animation}"] .skeleton`).first();
  expect(
    await bone("shimmer").evaluate((node) => getComputedStyle(node, "::after").animationName),
  ).toBe("skeleton");
  expect(await bone("pulse").evaluate((node) => getComputedStyle(node).animationName)).toBe(
    "pulse",
  );
});

test("the sweep runs reversed in right-to-left and forwards in left-to-right", async ({ page }) => {
  const direction = async (locale: string) => {
    await open(page, "light", locale, "no-preference");
    return page
      .locator('[data-animation="shimmer"] .skeleton')
      .first()
      .evaluate((node) => getComputedStyle(node, "::after").animationDirection);
  };
  expect(await direction("ar")).toBe("reverse");
  expect(await direction("en")).toBe("normal");
});

test("a group draws one sweep over still tiles", async ({ page }) => {
  await open(page, "light", "en", "no-preference");
  const group = page.locator('[data-sample="group"]');
  expect(await group.evaluate((node) => getComputedStyle(node, "::before").content)).not.toBe(
    "none",
  );
  const tile = group.locator(".skeleton").first();
  expect(await tile.evaluate((node) => getComputedStyle(node, "::after").content)).toBe("none");
});

test("the profile card cycles to a named placeholder and back, and the button keeps focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const region = page.getByRole("region", { name: "Loading to content" });
  const reload = region.getByRole("button", { name: "Reload" });
  await expect(region.getByText("Ada Lovelace", { exact: true })).toBeVisible();
  await reload.focus();
  await reload.press("Enter");
  await expect(region.getByRole("status")).toHaveText("Loading profile");
  await expect(region.getByText("Ada Lovelace", { exact: true })).toBeHidden();
  await expect(reload).toBeFocused();
  await expect(region.getByText("Ada Lovelace", { exact: true })).toBeVisible();
  await expect(region.getByRole("status")).toHaveText("");
});

test("bones are silent: no image, no progress bar and no text", async ({ page }) => {
  await open(page, "light", "en");
  for (const name of ["Animations", "Shapes", "One sweep"]) {
    const region = page.getByRole("region", { name });
    await expect(region.getByRole("img")).toHaveCount(0);
    await expect(region.getByRole("progressbar")).toHaveCount(0);
    const texts = await region
      .locator(".skeleton")
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText));
    expect(texts.every((text) => text === "")).toBe(true);
  }
});
