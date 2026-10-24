/**
 * Stackra file contract:
 * Purpose: the navigation-list route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every list is a named navigation landmark; the current entry is
 *          announced as the current page and is set apart without colour alone (a heavier weight and a bar at its
 *          start), and a link that only holds it is announced as current; a group heading names the nested list
 *          under it; the keyboard reaches each link in order and skips the disabled one, and Enter on a press-only
 *          entry runs it and moves the live current place without losing focus; a shortcut tooltip shows on keyboard
 *          focus and hides on Escape; the compact rail hides labels from the screen but not from the name, and shows
 *          them in a tooltip; the icon sits at the reading start in both directions; and every link is at least 24
 *          by 24 CSS pixels (WCAG 2.2 SC 2.5.8).
 * Boundary: the production build under `vite preview`; Chromium only. A tooltip is not modal, so role queries work
 *           throughout the page.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0314; ADR 0060 (light, dark, RTL); ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 1.4.1, 2.1.1, 2.5.8 and 4.1.2.
 */
// @covers sta-350:FR-156 sta-350:FR-162 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/navigation-list?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Navigation list" })).toBeVisible();
};

const weight = (link: Locator) =>
  link.evaluate((element) => Number(getComputedStyle(element).fontWeight));

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the navigation list page in ${scheme}, ${locale}`, async ({
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

test("every list is a navigation landmark with its own name", async ({ page }) => {
  await open(page, "light", "en");
  const names = await page
    .locator("main nav")
    .evaluateAll((navs) => navs.map((nav) => nav.getAttribute("aria-label")));
  expect(names.length).toBeGreaterThanOrEqual(9);
  expect(new Set(names).size).toBe(names.length);
  for (const name of names) expect(name, "an unnamed landmark").toBeTruthy();
});

test("the current entry is announced as the current page and set apart without colour alone", async ({
  page,
}) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Navigation with the current page" });
  const current = list.getByRole("link", { name: "Orders" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(list.locator("[aria-current]")).toHaveCount(1);
  expect(await weight(current)).toBeGreaterThan(
    await weight(list.getByRole("link", { name: "Home" })),
  );
  // The bar at the entry's start: a pseudo-element with a width, which is not colour.
  const barWidth = await current.evaluate((element) => getComputedStyle(element, "::before").width);
  expect(parseFloat(barWidth)).toBeGreaterThan(0);
});

test("a link that only holds the current entry is announced as current too", async ({ page }) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Navigation holding the current page" });
  await expect(list.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "true");
  await expect(list.getByRole("link", { name: "Returns" })).toHaveAttribute("aria-current", "page");
});

test("a group heading names the nested list under it", async ({ page }) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Grouped navigation" });
  await expect(list.getByRole("link", { name: "Settings" })).toHaveCount(0);
  const nested = list.getByRole("list", { name: "Settings" });
  await expect(nested.getByRole("link")).toHaveText(["Profile", "Billing"]);
});

test("the keyboard reaches each link in order and skips the disabled one", async ({ page }) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Navigation with a disabled entry" });
  const archive = list.getByRole("link", { name: "Archive" });
  await expect(archive).toHaveAttribute("aria-disabled", "true");
  await list.getByRole("link", { name: "Home" }).focus();
  await page.keyboard.press("Tab");
  await expect(list.getByRole("link", { name: "Run report" })).toBeFocused();
  await expect(archive).not.toBeFocused();
});

test("Enter on a press-only entry runs it and keeps focus on it", async ({ page }) => {
  await open(page, "light", "en");
  const report = page
    .getByRole("navigation", { name: "Navigation with a disabled entry" })
    .getByRole("link", { name: "Run report" });
  await report.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("press-count")).toHaveText("Pressed 1 time.");
  await expect(report).toBeFocused();
});

test("a press moves the current place of the live list and focus stays on the entry", async ({
  page,
}) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Live navigation" });
  await expect(page.getByTestId("current-page")).toHaveText("Current page: Home");
  const customers = list.getByRole("link", { name: "Customers" });
  await customers.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("current-page")).toHaveText("Current page: Customers");
  await expect(customers).toHaveAttribute("aria-current", "page");
  await expect(list.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", /.*/);
  await expect(customers).toBeFocused();
});

test("a shortcut shows in a tooltip on keyboard focus and hides on Escape", async ({ page }) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "Navigation with shortcuts" });
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  // A Tab from the link before puts the page in keyboard modality, which React Aria needs to show a tooltip.
  await list.getByRole("link", { name: "Home" }).focus();
  await page.keyboard.press("Tab");
  await expect(list.getByRole("link", { name: "Orders" })).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("G then O");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("the compact rail hides the labels from the screen, keeps them as names and shows them in a tooltip", async ({
  page,
}) => {
  await open(page, "light", "en");
  const rail = page.getByRole("navigation", { name: "Compact navigation" });
  const home = rail.getByRole("link", { name: "Home" });
  const box = await boxOf(home);
  expect(box.width).toBeLessThanOrEqual(64);
  // The label is in the name but occupies no room on the screen.
  const label = home.locator(".sr-only").first();
  const labelBox = await boxOf(label);
  expect(labelBox.width).toBeLessThanOrEqual(1);
  const orders = rail.getByRole("link", { name: /^Orders/ });
  await home.focus();
  await page.keyboard.press("Tab");
  await expect(orders).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("Orders");
});

for (const locale of LOCALES)
  test(`the icon sits at the reading start of each entry in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const home = page
      .getByRole("navigation", { name: "Basic navigation" })
      .getByRole("link", { name: "Home" });
    const link = await boxOf(home);
    const icon = await boxOf(home.locator("svg").first());
    const centre = icon.x + icon.width / 2;
    const middle = link.x + link.width / 2;
    if (locale === "en") expect(centre).toBeLessThan(middle);
    else expect(centre).toBeGreaterThan(middle);
  });

test("the Arabic list reads right to left with the icon at the right", async ({ page }) => {
  await open(page, "light", "en");
  const list = page.getByRole("navigation", { name: "قائمة التنقل" });
  const home = list.getByRole("link", { name: "الرئيسية" });
  const link = await boxOf(home);
  const icon = await boxOf(home.locator("svg").first());
  expect(icon.x + icon.width / 2).toBeGreaterThan(link.x + link.width / 2);
  await expect(list.getByRole("link", { name: "الطلبات" })).toHaveAttribute("aria-current", "page");
});

test("every link is at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const links = page.locator("main nav a, main nav [role='link']");
  const count = await links.count();
  expect(count).toBeGreaterThan(20);
  for (let index = 0; index < count; index += 1) {
    const box = await boxOf(links.nth(index));
    expect(box.width, `link ${index}`).toBeGreaterThanOrEqual(24);
    expect(box.height, `link ${index}`).toBeGreaterThanOrEqual(24);
  }
});
