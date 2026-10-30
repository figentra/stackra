/**
 * Stackra file contract:
 * Purpose: the cursor pagination route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every pagination is a named navigation landmark; the live pager walks
 *          forward and back by keyboard, keeps focus on the pressed button while a page loads and refuses both presses
 *          meanwhile, and ends with next disabled; the growing list adds a page per press, updates its count as a status
 *          and loses its button at the end; previous sits at the inline start in both directions; and every button is
 *          at least 24 px tall.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decision 4); ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 2.1.1, 2.5.8, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-142 sta-350:FR-146 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/cursor-pagination?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Cursor pagination", locale) }),
  ).toBeVisible();
};

/** The list of orders the live pager shows on its current page. */
const pagerOrders = (page: Page) => page.getByRole("list", { name: "Orders on this page" });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the cursor pagination page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
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

test("every pagination is a navigation landmark with its own name", async ({ page }) => {
  await open(page, "light", "en");
  // The demos load lazily, each in its own Suspense and in no set order: wait until every one has mounted.
  await expect(page.locator("[data-demo-loading]")).toHaveCount(0);
  const names = await page.locator("nav[aria-label]").evaluateAll((navs) =>
    navs
      // The preview copies are hidden from assistive tech, and the "On this page" menu or rail the width does not
      // draw is display: none, so neither is a landmark.
      .filter((nav) => nav.checkVisibility() && !nav.closest('[aria-hidden="true"]'))
      .map((nav) => nav.getAttribute("aria-label")),
  );
  expect(names.length).toBeGreaterThan(10);
  expect(new Set(names).size).toBe(names.length);
  await expect(page.getByRole("navigation", { name: "Orders, paged" })).toBeVisible();
});

test("the pager's buttons are disabled where their page does not exist", async ({ page }) => {
  await open(page, "light", "en");
  const first = page.getByRole("navigation", { name: "First page" });
  await expect(first.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(first.getByRole("button", { name: "Next" })).toBeEnabled();
  const last = page.getByRole("navigation", { name: "Last page" });
  await expect(last.getByRole("button", { name: "Previous" })).toBeEnabled();
  await expect(last.getByRole("button", { name: "Next" })).toBeDisabled();
  const only = page.getByRole("navigation", { name: "Only page" });
  await expect(only.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(only.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("the live pager walks forward and back by keyboard and keeps focus while a page loads", async ({
  page,
}) => {
  await open(page, "light", "en");
  const pager = page.getByRole("navigation", { name: "Orders, paged" });
  const next = pager.getByRole("button", { name: "Next" });
  const previous = pager.getByRole("button", { name: "Previous" });
  await expect(pagerOrders(page).getByRole("listitem").first()).toHaveText("Order 1001");
  await expect(pager.getByRole("status")).toHaveText("Showing 10 items");

  await next.focus();
  await page.keyboard.press("Enter");
  // While the fake server answers, the list is busy, both presses are refused and focus stays on the button.
  await expect(pagerOrders(page)).toHaveAttribute("aria-busy", "true");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(previous).toBeDisabled();
  await expect(next).toBeFocused();
  await expect(pagerOrders(page).getByRole("listitem").first()).toHaveText("Order 1011");
  await expect(pagerOrders(page)).toHaveAttribute("aria-busy", "false");
  await expect(page.getByTestId("cursor")).toHaveText("Cursor: 10");
  await expect(previous).toBeEnabled();

  await previous.focus();
  await page.keyboard.press("Space");
  await expect(pagerOrders(page).getByRole("listitem").first()).toHaveText("Order 1001");
  await expect(page.getByTestId("cursor")).toHaveText("Cursor: 0");
  await expect(previous).toBeDisabled();
});

test("the live pager ends on a short last page with next disabled", async ({ page }) => {
  await open(page, "light", "en");
  const pager = page.getByRole("navigation", { name: "Orders, paged" });
  const next = pager.getByRole("button", { name: "Next" });
  for (const cursor of [10, 20, 30, 40]) {
    await next.click();
    await expect(page.getByTestId("cursor")).toHaveText(`Cursor: ${cursor}`);
  }
  await expect(next).toBeDisabled();
  await expect(pager.getByRole("status")).toHaveText("Showing 5 items");
  await expect(pagerOrders(page).getByRole("listitem")).toHaveCount(5);
});

test("the growing list adds a page per press, counts it as a status and keeps its button, disabled, at the end", async ({
  page,
}) => {
  await open(page, "light", "en");
  const growing = page.getByRole("navigation", { name: "Orders, growing" });
  const orders = page.getByRole("list", { name: "Orders loaded so far" }).getByRole("listitem");
  const more = growing.getByRole("button", { name: "Load more" });
  await expect(orders).toHaveCount(10);
  await expect(growing.getByRole("status")).toHaveText("Showing 10 items");
  await more.click();
  await expect(orders).toHaveCount(20);
  await expect(growing.getByRole("status")).toHaveText("Showing 20 items");
  for (const count of [30, 40, 45]) {
    await more.click();
    await expect(orders).toHaveCount(count);
  }
  // The button stays mounted, so focus on it is not lost when the last page arrives.
  await expect(more).toBeDisabled();
  await expect(growing.getByRole("status")).toHaveText("Showing 45 items");
});

for (const locale of LOCALES)
  test(`previous sits at the inline start in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By place: the pager's name speaks the page's locale; Middle page is the usage's second.
    const pager = example(page, "usage").getByRole("navigation").nth(1);
    const [previous, next] = await Promise.all([
      pager.getByRole("button").first().boundingBox(),
      pager.getByRole("button").last().boundingBox(),
    ]);
    if (!previous || !next) throw new Error("the pager has no buttons");
    expect(previous.x < next.x).toBe(locale === "en");
  });

for (const size of ["sm", "md", "lg"] as const)
  test(`the ${size} buttons are at least 24 px tall`, async ({ page }) => {
    await open(page, "light", "en");
    const buttons = page.getByRole("navigation", { name: `Size ${size}` }).getByRole("button");
    for (const box of await Promise.all([
      buttons.first().boundingBox(),
      buttons.last().boundingBox(),
    ])) {
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    }
  });
