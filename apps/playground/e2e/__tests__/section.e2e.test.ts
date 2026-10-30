/**
 * Stackra file contract:
 * Purpose: the section route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in light,
 *          dark, left-to-right and right-to-left, also after the live section has changed; the page holds one `h1` and
 *          its samples are level-3 headings; each section is a region named by its title, and the two that share a title
 *          are named by their labels; the title leads and the actions follow it, mirrored in right-to-left; the first
 *          action is the primary button and the next two secondary; six actions draw three buttons and a menu of three,
 *          which opens from the keyboard, runs an entry and returns focus to its button; a disabled action is a disabled
 *          button; a link action is a link that navigates; every action reaches 24 px; and the live section's primary
 *          action switches it between viewing and editing while keeping focus.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open menu
 *           from the accessibility tree, so role queries outside one find nothing: CSS locators are used while a menu
 *           is open and role queries after it closes.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0317 (decisions 1 and 5); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.4.6, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-173 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/section?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Section", locale) }),
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

/** The samples of an example, one list item each. */
const samples = (page: Page, id: string) => example(page, id).locator("ul > li");

/** The live section and its report. */
const liveSection = (page: Page) => example(page, "live").locator("section");
const liveStatus = (page: Page) => example(page, "live").getByRole("status");

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the section page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

    test(`axe finds nothing after the live section changes in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      // The primary action, by position: its name ("Edit", then "Done") is in the page's locale.
      const primary = liveSection(page).getByRole("button").first();
      const viewing = await primary.textContent();
      await primary.click();
      await expect(primary).not.toHaveText(viewing ?? "");
      await expectAxeClean(page);
    });
  }

test("the page holds one h1 and its samples are level-3 headings", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(samples(page, "usage").getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(samples(page, "actions").getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
});

test("each section is a region named by its title, and two with one title by their labels", async ({
  page,
}) => {
  await open(page, "light", "en");
  const parts = samples(page, "usage");
  await expect(parts.nth(4).locator("section")).toHaveAccessibleName("Order details");
  await expect(page.getByRole("region", { name: "Order details" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Billing address" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Shipping address" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Address", exact: true })).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the title leads and the actions follow it in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const section = samples(page, "actions").nth(1).locator("section");
    const title = await boxOf(section.getByRole("heading", { level: 3 }));
    const buttons = await section.getByRole("button").all();
    expect(buttons).toHaveLength(3);
    const first = await boxOf(buttons[0] as Locator);
    const last = await boxOf(buttons[2] as Locator);
    // In a narrow example pane the header wraps its actions onto the next row: they still follow the title.
    if (Math.abs(first.y - title.y) < title.height) {
      if (locale === "en") expect(first.x).toBeGreaterThan(title.x + title.width - 1);
      else expect(first.x + first.width).toBeLessThan(title.x + 1);
    } else expect(first.y).toBeGreaterThanOrEqual(title.y + title.height);
    if (locale === "en") expect(last.x).toBeGreaterThan(first.x);
    else expect(last.x).toBeLessThan(first.x);
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
  const section = samples(page, "actions").nth(2).locator("section");
  await expect(section.getByRole("button")).toHaveCount(4);
  const more = section.locator('button[aria-label="More actions for this section"]');
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
  const section = samples(page, "actions").nth(3).locator("section");
  await expect(section.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(section.getByRole("button", { name: "Delete" })).toHaveClass(/button--danger-soft/);
});

test("an action with an href is a link drawn as a button, and following it navigates", async ({
  page,
}) => {
  await open(page, "light", "en");
  const link = samples(page, "actions").nth(4).getByRole("link", { name: "Open the page header" });
  await expect(link).toHaveAttribute("href", "/page-header");
  await expect(link).toHaveClass(/button--primary/);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Page header" })).toBeVisible();
});

test("every action reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const controls = example(page, "actions").locator("ul section").locator("button, a[href]");
  await expect(controls.first()).toBeVisible();
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    const box = await boxOf(control);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the live section's primary action switches it to editing and back, keeping focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const section = liveSection(page);
  await expect(section.getByText("Viewing the contact details.")).toBeVisible();
  await section.getByRole("button", { name: "Edit" }).focus();
  await page.keyboard.press("Enter");
  await expect(section.getByText("Editing the contact details.")).toBeVisible();
  await expect(section.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(section.getByText("Viewing the contact details.")).toBeVisible();
  await expect(section.getByRole("button", { name: "Edit" })).toBeFocused();
});

test("the live section reports a button's action and a menu entry, returning focus to the menu button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const section = liveSection(page);
  await section.getByRole("button", { name: "Export" }).click();
  await expect(liveStatus(page)).toHaveText("Action chosen: Export.");

  const more = section.locator('button[aria-label="More actions for this section"]');
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(liveStatus(page)).toHaveText("Action chosen: Archive.");
  await expect(more).toBeFocused();
});

for (const locale of LOCALES)
  test(`the Arabic section sits right to left whatever the page's direction, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const section = example(page, "arabic").locator("section");
    const box = await boxOf(section);
    const title = await boxOf(section.getByRole("heading", { level: 3 }));
    const edit = await boxOf(section.getByRole("button", { name: "تعديل" }));
    // The title starts at the right edge; the actions follow it to its left, or wrap under it from the right.
    expect(title.x + title.width / 2).toBeGreaterThan(box.x + box.width / 2);
    if (Math.abs(edit.y - title.y) < title.height) expect(title.x).toBeGreaterThan(edit.x);
    else expect(edit.x + edit.width / 2).toBeGreaterThan(box.x + box.width / 2);
  });
