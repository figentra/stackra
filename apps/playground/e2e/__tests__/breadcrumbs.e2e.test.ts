/**
 * Stackra file contract:
 * Purpose: the breadcrumbs route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every trail is a named navigation landmark over an ordered list whose last
 *          step is the current page and not a link; the keyboard reaches each link in order and skips the current page,
 *          and Enter on a press-only step runs it; a step of the live trail cuts it back and the button goes one level
 *          deeper; the separator sits after its step in the reading direction in both directions; and a long trail
 *          wraps in a narrow column instead of scrolling sideways.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0182 (test tiers); ADR 0022 (test placement); WCAG 2.2
 *          SC 1.4.10, 2.1.1, 2.4.8, 4.1.2.
 */
// @covers sta-350:FR-144 sta-350:FR-146 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/breadcrumbs?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Breadcrumbs" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the breadcrumbs page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each trail is a named navigation over an ordered list, ending in the current page", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "Order location" });
  await expect(trail).toBeVisible();
  await expect(trail.locator("ol > li")).toHaveCount(3);
  await expect(trail.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    /#breadcrumbs-trail$/,
  );
  const current = trail.locator("[aria-current='page']");
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText("Order 1042");
  await expect(current).not.toHaveAttribute("href", /.*/);
  // Every landmark has its own name, so a screen reader's landmark list tells them apart.
  const names = await page
    .locator("nav[aria-label]")
    .evaluateAll((navs) => navs.map((nav) => nav.getAttribute("aria-label")));
  expect(new Set(names).size).toBe(names.length);
});

test("the keyboard reaches each link in order and skips the current page", async ({ page }) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "Order location" });
  await trail.getByRole("link", { name: "Home" }).focus();
  await page.keyboard.press("Tab");
  await expect(trail.getByRole("link", { name: "Orders" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trail.locator("[aria-current='page']")).not.toBeFocused();
});

test("Enter on a press-only step runs it", async ({ page }) => {
  await open(page, "light", "en");
  const steps = page.getByRole("navigation", { name: "Press-only trail" });
  await steps.getByRole("link", { name: "Home" }).focus();
  await page.keyboard.press("Enter");
  await steps.getByRole("link", { name: "Orders" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("press-count")).toHaveText("Pressed 2 times.");
});

test("a step of the live trail cuts it back, and the button goes one level deeper", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "Drill-down trail" });
  const deeper = page.getByRole("button", { name: "Go one level deeper" });
  await expect(page.getByTestId("current-page")).toHaveText("Current page: Invoice");
  await expect(deeper).toBeDisabled();
  await trail.getByRole("link", { name: "Orders" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("current-page")).toHaveText("Current page: Orders");
  await expect(trail.locator("ol > li")).toHaveCount(2);
  await expect(deeper).toBeEnabled();
  await deeper.click();
  await expect(page.getByTestId("current-page")).toHaveText("Current page: Order 1042");
  await expect(trail.locator("[aria-current='page']")).toHaveText("Order 1042");
});

for (const locale of LOCALES)
  test(`the separator sits after its step in the reading direction in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const first = page
      .getByRole("navigation", { name: "Order location" })
      .locator("ol > li")
      .first();
    const [link, separator] = await Promise.all([
      first.getByRole("link").boundingBox(),
      first.locator("[data-slot='breadcrumbs-separator']").boundingBox(),
    ]);
    if (!link || !separator) throw new Error("the first step has no box");
    const separatorIsAfter =
      locale === "en" ? separator.x > link.x : separator.x + separator.width < link.x + link.width;
    expect(separatorIsAfter).toBe(true);
  });

test("a long trail wraps in a narrow column and does not scroll sideways", async ({ page }) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "Long trail" });
  const [first, last] = await Promise.all([
    trail.locator("ol > li").first().boundingBox(),
    trail.locator("ol > li").last().boundingBox(),
  ]);
  if (!first || !last) throw new Error("the trail has no box");
  expect(last.y).toBeGreaterThan(first.y);
  const overflows = await trail.evaluate((nav) => nav.scrollWidth > nav.clientWidth);
  expect(overflows).toBe(false);
});

test("the Arabic trail runs from the right and its chevrons turn", async ({ page }) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "مسار الصفحة" });
  const [home, order] = await Promise.all([
    trail.getByRole("link", { name: "الرئيسية" }).boundingBox(),
    trail.locator("[aria-current='page']").boundingBox(),
  ]);
  if (!home || !order) throw new Error("the trail has no box");
  expect(home.x).toBeGreaterThan(order.x);
  const turned = await trail
    .locator("[data-slot='breadcrumbs-separator']")
    .first()
    .evaluate((icon) => getComputedStyle(icon).rotate !== "none");
  expect(turned).toBe(true);
});
