/**
 * Stackra file contract:
 * Purpose: the sidebar route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each sidebar holds one named navigation landmark; the toggle folds the
 *          sidebar from 16 rem to the 4 rem rail and back from the keyboard, keeps focus and changes its own name; the
 *          rail keeps every label as a name and shows it in a tooltip; the outside button and the toggle drive the
 *          same state and the page reports it; a sidebar with no toggle has no button; the sidebar's border sits on
 *          its inner side and the toggle's icon turns in right-to-left; and every link and the toggle are at least 24
 *          by 24 CSS pixels (WCAG 2.2 SC 2.5.8).
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0314; ADR 0060 (light, dark, RTL); ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8 and 4.1.2.
 */
// @covers sta-350:FR-158 sta-350:FR-162 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/sidebar?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Sidebar" })).toBeVisible();
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

/** The sidebar root of a named navigation: the navigation's parent, which holds the slots and the toggle. */
const sidebarOf = (page: Page, name: string) =>
  page.getByRole("navigation", { name }).locator("xpath=..");

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the sidebar page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each sidebar holds one navigation landmark with its own name", async ({ page }) => {
  await open(page, "light", "en");
  const names = await page
    .locator("main nav")
    .evaluateAll((navs) => navs.map((nav) => nav.getAttribute("aria-label")));
  expect(names).toHaveLength(6);
  expect(new Set(names).size).toBe(6);
});

test("the sidebar is 16 rem wide expanded and 4 rem wide as the rail", async ({ page }) => {
  await open(page, "light", "en");
  expect((await boxOf(sidebarOf(page, "Expanded sidebar"))).width).toBeCloseTo(256, 0);
  expect((await boxOf(sidebarOf(page, "Collapsed sidebar"))).width).toBeCloseTo(64, 0);
});

test("the toggle folds and unfolds the sidebar from the keyboard and keeps focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const root = sidebarOf(page, "Live sidebar");
  const collapse = root.getByRole("button", { name: "Collapse sidebar" });
  await collapse.focus();
  await page.keyboard.press("Enter");
  const expand = root.getByRole("button", { name: "Expand sidebar" });
  await expect(expand).toBeFocused();
  await expect(page.getByTestId("sidebar-state")).toHaveText("Sidebar: collapsed");
  await expect.poll(async () => (await boxOf(root)).width).toBeCloseTo(64, 0);
  await page.keyboard.press("Space");
  await expect(root.getByRole("button", { name: "Collapse sidebar" })).toBeFocused();
  await expect(page.getByTestId("sidebar-state")).toHaveText("Sidebar: expanded");
  await expect.poll(async () => (await boxOf(root)).width).toBeCloseTo(256, 0);
});

test("the outside button drives the same state", async ({ page }) => {
  await open(page, "light", "en");
  const root = sidebarOf(page, "Live sidebar");
  await page.getByRole("button", { name: "Toggle from outside" }).click();
  await expect(page.getByTestId("sidebar-state")).toHaveText("Sidebar: collapsed");
  await expect(root.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle from outside" }).click();
  await expect(page.getByTestId("sidebar-state")).toHaveText("Sidebar: expanded");
});

test("the rail keeps every label as a name, shows it in a tooltip and marks the current place", async ({
  page,
}) => {
  await open(page, "light", "en");
  const rail = page.getByRole("navigation", { name: "Collapsed sidebar" });
  const home = rail.getByRole("link", { name: "Home" });
  await expect(home).toBeVisible();
  expect((await boxOf(home)).width).toBeLessThanOrEqual(64);
  await home.focus();
  await page.keyboard.press("Tab");
  await expect(rail.getByRole("link", { name: /^Orders/ })).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("Orders");
  await expect(
    page
      .getByRole("navigation", { name: "Sidebar with the current place" })
      .getByRole("link", { name: /^Orders/ }),
  ).toHaveAttribute("aria-current", "page");
});

test("a sidebar with no toggle has no button", async ({ page }) => {
  await open(page, "light", "en");
  await expect(sidebarOf(page, "Sidebar without a toggle").getByRole("button")).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the border is on the inner side and the toggle's icon turns in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const root = sidebarOf(page, "Expanded sidebar");
    const border = await root.evaluate((element) => {
      const style = getComputedStyle(element);
      return { start: style.borderInlineStartWidth, end: style.borderInlineEndWidth };
    });
    expect(parseFloat(border.end)).toBeGreaterThan(0);
    expect(parseFloat(border.start)).toBe(0);
    const matrix = await root
      .getByRole("button", { name: "Collapse sidebar" })
      .locator("svg")
      .evaluate((svg) => getComputedStyle(svg).transform);
    // Mirrored in right-to-left (a negative x scale), untouched in left-to-right.
    if (locale === "ar") expect(matrix).toMatch(/^matrix\(-1/);
    else expect(matrix).not.toMatch(/^matrix\(-1/);
  });

test("the Arabic sidebar reads right to left with the icon at the right", async ({ page }) => {
  await open(page, "light", "en");
  const nav = page.getByRole("navigation", { name: "الشريط الجانبي" });
  const home = nav.getByRole("link", { name: "الرئيسية" });
  const link = await boxOf(home);
  const icon = await boxOf(home.locator("svg").first());
  expect(icon.x + icon.width / 2).toBeGreaterThan(link.x + link.width / 2);
});

test("every link and the toggle are at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const targets = page.locator("main nav a, main nav [role='link'], main nav ~ button");
  const count = await targets.count();
  expect(count).toBeGreaterThan(20);
  for (let index = 0; index < count; index += 1) {
    const box = await boxOf(targets.nth(index));
    expect(box.width, `target ${index}`).toBeGreaterThanOrEqual(24);
    expect(box.height, `target ${index}`).toBeGreaterThanOrEqual(24);
  }
});
