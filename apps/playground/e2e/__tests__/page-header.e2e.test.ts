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
 * Governing contract: ADR 0302 (decision 5); ADR 0317 (decisions 1 and 5); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.4.6, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-168 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/page-header?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Page header", locale) }),
  ).toBeVisible();
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

/** The samples of an example, the items of its outer list. */
const samples = (page: Page, id: string) =>
  example(page, id).getByRole("list").first().locator(":scope > li");

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
      // The first action, Mark as shipped, by position: the Arabic page translates it.
      const badge = liveHeader(page).locator('[data-slot="chip-label"]');
      const before = await badge.textContent();
      await liveHeader(page).getByRole("button").first().click();
      await expect(badge).not.toHaveText(before ?? "");
      if (locale === "en")
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
  await expect(samples(page, "usage").getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the title leads and the actions follow it in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const header = samples(page, "actions").nth(1).locator("header");
    await expect(header.getByRole("button")).toHaveCount(3);
    // Measured in one frame: the page above may still shift while its lazy demos load.
    const [title, first, last] = await header.evaluate((node) =>
      [node.querySelector("h3"), ...node.querySelectorAll("button")]
        .filter((_, index) => index !== 2)
        .map((element) => element?.getBoundingClientRect().toJSON() as DOMRect | undefined),
    );
    if (!title || !first || !last) throw new Error("a box is missing");
    // The example's pane is narrower than title and actions together, so the actions wrap onto the next row,
    // from the reading start.
    if (first.y >= title.y + title.height - 1) {
      if (locale === "en") expect(Math.abs(first.x - title.x)).toBeLessThanOrEqual(1);
      else expect(Math.abs(first.x + first.width - (title.x + title.width))).toBeLessThanOrEqual(1);
      expect(last.x > first.x, locale).toBe(locale === "en");
    } else if (locale === "en") {
      expect(first.x).toBeGreaterThan(title.x + title.width - 1);
      expect(last.x).toBeGreaterThan(first.x);
    } else {
      expect(first.x + first.width).toBeLessThan(title.x + 1);
      expect(last.x).toBeLessThan(first.x);
    }
  });

test("the first action is the primary button and the next two are secondary", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = samples(page, "actions").nth(1).getByRole("button");
  await expect(buttons.nth(0)).toHaveClass(/button--primary/);
  await expect(buttons.nth(1)).toHaveClass(/button--secondary/);
  await expect(buttons.nth(2)).toHaveClass(/button--secondary/);
});

test("six actions draw three buttons and a menu of three that opens from the keyboard", async ({
  page,
}) => {
  await open(page, "light", "en");
  const header = samples(page, "actions").nth(2).locator("header");
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
  const header = samples(page, "actions").nth(3).locator("header");
  await expect(header.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(header.getByRole("button", { name: "Delete" })).toHaveClass(/button--danger-soft/);
});

test("an action with an href is a link drawn as a button, and following it navigates", async ({
  page,
}) => {
  await open(page, "light", "en");
  const link = samples(page, "actions").nth(4).getByRole("link", { name: "Open the app header" });
  await expect(link).toHaveAttribute("href", "/app-header");
  await expect(link).toHaveClass(/button--primary/);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "App header" })).toBeVisible();
});

test("every action reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  await expect(example(page, "actions").locator("header").first()).toBeVisible();
  const controls = samples(page, "actions").locator("header").locator("button, a[href]");
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
  // React Aria draws the current step as a disabled link with no href, so two steps lead anywhere.
  await expect(trail.locator("a[href]")).toHaveCount(2);
  await expect(trail.locator('[aria-current="page"]')).toHaveText("Order 1042");
  await expect(trail.locator('[aria-current="page"]')).not.toHaveAttribute("href");
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
