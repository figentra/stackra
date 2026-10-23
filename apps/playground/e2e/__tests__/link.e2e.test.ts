/**
 * Stackra file contract:
 * Purpose: the link route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; an internal link navigates through the router without a document reload,
 *          keeps the scheme and language and moves focus to the new h1; an external link opens a popup and says so in
 *          its name; the keyboard reaches the press-only link and skips the disabled one; the external mark sits at the
 *          inline end in both directions; and every link inside a paragraph is underlined in both schemes.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decisions 5 and 7); WCAG 2.2 SC 1.4.1; ADR 0182 (test
 *          tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-025 sta-350:FR-026 sta-350:FR-028 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/link?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Link" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the link page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("an internal link navigates without a reload, keeps the display and focuses the h1", async ({
  page,
}) => {
  await open(page, "dark", "ar");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "kept";
  });
  await page.getByRole("link", { name: "Go to Foundations" }).click();
  await expect(page).toHaveURL(/\/foundations\?scheme=dark&locale=ar$/);
  const heading = page.getByRole("heading", { level: 1, name: "Foundations" });
  await expect(heading).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe("kept");
});

test("an external link opens a popup and says so in its name", async ({ page }) => {
  await open(page, "light", "en");
  const link = page.getByRole("link", { name: "HeroUI documentation" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAccessibleName(/opens in a new tab$/);
  // The popup is only waited for, never loaded: the request is cancelled so the suite needs no network.
  await page.context().route("https://heroui.com/**", (route) => route.abort());
  const popup = page.waitForEvent("popup");
  await link.click();
  await popup;
  await expect(page.getByRole("heading", { level: 1, name: "Link" })).toBeVisible();
});

test("the keyboard reaches the press-only link and skips the disabled one", async ({ page }) => {
  await open(page, "light", "en");
  const disabled = page.getByText("Disabled link");
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  const press = page.getByRole("link", { name: "Press only" });
  await press.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("press-count")).toHaveText("Pressed 1 time.");
  // Tab through the rest of the page: the disabled link never takes focus.
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    await expect(disabled).not.toBeFocused();
  }
});

for (const locale of LOCALES)
  test(`the external mark sits at the inline end in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const link = page.getByRole("link", { name: "HeroUI documentation" });
    const [mark, box] = await Promise.all([
      link.locator("[data-slot='link-icon']").boundingBox(),
      link.boundingBox(),
    ]);
    if (!mark || !box) throw new Error("the link has no box");
    const markIsLeft = mark.x + mark.width / 2 < box.x + box.width / 2;
    expect(markIsLeft).toBe(locale === "ar");
  });

for (const scheme of SCHEMES)
  test(`every link inside a paragraph is underlined in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const links = page.locator("main p a");
    expect(await links.count()).toBeGreaterThan(0);
    const lines = await links.evaluateAll((anchors) =>
      anchors.map((anchor) => getComputedStyle(anchor).textDecorationLine),
    );
    for (const line of lines) expect(line).toContain("underline");
  });
