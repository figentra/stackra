/**
 * Stackra file contract:
 * Purpose: the page-header route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left, also after the live header has changed; the page holds one
 *          `h1`, the page header's, and no skipped outline level; the title leads and the actions follow it, mirrored in
 *          right-to-left; the first action is the primary button and the next two secondary; six actions draw three
 *          buttons and a menu of three, which opens from the keyboard, runs an entry and returns focus to its button;
 *          a disabled action is a disabled button; a link action is a link that navigates; every action reaches 24 px;
 *          and the live header's primary action changes the status and its own label while keeping focus.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open menu
 *           from the accessibility tree, so role queries outside one find nothing: CSS locators are used while a menu
 *           is open and role queries after it closes.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0314 (decisions 1 and 5); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.4.6, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-168 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/page-header?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Page header" })).toBeVisible();
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

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

/** The headers of a section's samples, found by CSS. */
const samples = (page: Page, id: string) => page.locator(`#${id} ~ ul > li`);

/** The live header and its report. */
const liveHeader = (page: Page) => page.locator('[data-sample="live"] header');
const liveStatus = (page: Page) => page.locator('[data-sample="live-status"]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the page header page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing after the live header changes in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await liveHeader(page).getByRole("button", { name: "Mark as shipped" }).click();
      await expect(liveHeader(page).getByText("Shipped", { exact: true })).toBeVisible();
      await expectAxeClean(page);
    });
  }

test("the page holds one h1, the page header's, and its samples are level-3 headings", async ({
  page,
}) => {
  await open(page, "light", "en");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1.locator("xpath=ancestor::header")).toHaveCount(1);
  await expect(samples(page, "page-header-parts").getByRole("heading", { level: 3 })).toHaveCount(
    5,
  );
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the title leads and the actions follow it in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const header = samples(page, "page-header-actions").nth(1).locator("header");
    const title = await boxOf(header.getByRole("heading", { level: 3 }));
    const buttons = await header.getByRole("button").all();
    expect(buttons).toHaveLength(3);
    const first = await boxOf(buttons[0] as Locator);
    const last = await boxOf(buttons[2] as Locator);
    if (locale === "en") {
      expect(first.x).toBeGreaterThan(title.x + title.width - 1);
      expect(last.x).toBeGreaterThan(first.x);
    } else {
      expect(first.x + first.width).toBeLessThan(title.x + 1);
      expect(last.x).toBeLessThan(first.x);
    }
  });

test("the first action is the primary button and the next two are secondary", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = samples(page, "page-header-actions").nth(1).getByRole("button");
  await expect(buttons.nth(0)).toHaveClass(/button--primary/);
  await expect(buttons.nth(1)).toHaveClass(/button--secondary/);
  await expect(buttons.nth(2)).toHaveClass(/button--secondary/);
});

test("six actions draw three buttons and a menu of three that opens from the keyboard", async ({
  page,
}) => {
  await open(page, "light", "en");
  const header = samples(page, "page-header-actions").nth(2).locator("header");
  await expect(header.getByRole("button")).toHaveCount(4);
  const more = header.locator('button[aria-label="More actions for this order"]');
  await more.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(["Duplicate", "Print", "Archive"]);
  await expect(menu.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(more).toBeFocused();
});

test("a disabled action is a disabled button and a danger action is drawn in the danger colours", async ({
  page,
}) => {
  await open(page, "light", "en");
  const header = samples(page, "page-header-actions").nth(3).locator("header");
  await expect(header.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(header.getByRole("button", { name: "Delete" })).toHaveClass(/button--danger-soft/);
});

test("an action with an href is a link drawn as a button, and following it navigates", async ({
  page,
}) => {
  await open(page, "light", "en");
  const link = samples(page, "page-header-actions")
    .nth(4)
    .getByRole("link", { name: "Open the app header" });
  await expect(link).toHaveAttribute("href", "/app-header");
  await expect(link).toHaveClass(/button--primary/);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "App header" })).toBeVisible();
});

test("every action reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const controls = page.locator("#page-header-actions ~ ul header").locator("button, a[href]");
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    const box = await boxOf(control);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the sample with every part holds one trail whose last step is the current page", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trail = page.getByRole("navigation", { name: "Breadcrumbs" });
  await expect(trail).toHaveCount(1);
  await expect(trail.getByRole("link")).toHaveCount(2);
  await expect(trail.locator('[aria-current="page"]')).toHaveText("Order 1042");
});

test("the live header's primary action changes the status and its own label and keeps focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const header = liveHeader(page);
  const primary = header.getByRole("button", { name: "Mark as shipped" });
  await expect(header.getByText("Paid", { exact: true })).toBeVisible();
  await primary.focus();
  await page.keyboard.press("Enter");
  await expect(header.getByText("Shipped", { exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Undo shipping" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(header.getByText("Paid", { exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Mark as shipped" })).toBeFocused();
});

test("the live header reports a button's action and a menu entry, returning focus to the menu button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const header = liveHeader(page);
  await header.getByRole("button", { name: "Export" }).click();
  await expect(liveStatus(page)).toHaveText("Action chosen: Export.");

  const more = header.locator('button[aria-label="More actions for this order"]');
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "Print" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(liveStatus(page)).toHaveText("Action chosen: Print.");
  await expect(more).toBeFocused();
});

for (const locale of LOCALES)
  test(`the Arabic header sits right to left whatever the page's direction, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const header = page.locator('[data-sample="arabic"] header');
    const title = await boxOf(header.getByRole("heading", { level: 3 }));
    const edit = await boxOf(header.getByRole("button", { name: "تعديل" }));
    expect(title.x).toBeGreaterThan(edit.x);
  });
