/**
 * Stackra file contract:
 * Purpose: the app-shell route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left, on a wide window and a narrow one, and in the open drawer;
 *          the sidebar is a column from the `md` breakpoint (768 px) and `xl` (1280 px) up and is gone below it, where
 *          the header's button opens it in a drawer instead; the drawer is a dialog named for navigation, moves focus
 *          inside, hides the page behind it, traps Tab and Shift+Tab, shows the sidebar in full (no toggle), sits on the
 *          start edge in both directions, and closes on Escape, on a press on the backdrop, on Close and on choosing an
 *          entry, returning focus to the button that opened it; the live shell opens its drawer at any width and
 *          reports the state; and the page behind an embedded shell holds one main landmark and no second skip link.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           drawer from the accessibility tree, so role queries outside one find nothing: CSS locators and the opener
 *           button after it closes are used there. Axe scans the open drawer alone, because the page behind it is
 *           deliberately hidden and the page-level rules belong to the closed page.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0317 (decisions 5 and 6); ADR 0060 (light, dark, RTL); ADR
 *          0182 (test tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.2, 2.4.1, 2.4.3 and 4.1.2.
 */
// @covers sta-350:FR-160 sta-350:FR-162 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const WIDE = { width: 1280, height: 800 } as const;
const NARROW = { width: 600, height: 800 } as const;

const open = async (
  page: Page,
  scheme: string,
  locale: string,
  viewport: { width: number; height: number } = WIDE,
) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/app-shell?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "App shell" })).toBeVisible();
};

/** Waits until the open drawer has finished entering, so axe and the boxes see its final state. */
const settled = async (page: Page) => {
  const dialog = page.locator('[data-slot="drawer-dialog"]');
  await expect(dialog).toBeVisible();
  for (const slot of ["drawer-backdrop", "drawer-content"])
    await expect(page.locator(`[data-slot="${slot}"]`)).not.toHaveAttribute(
      "data-entering",
      "true",
    );
  return dialog;
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

const isFocusInside = (dialog: Locator) =>
  dialog.evaluate((element) => element.contains(document.activeElement));

/** The frame section's header button, which opens the drawer on a narrow window. */
const frameOpener = (page: Page) =>
  page
    .getByRole("region", { name: "Frame" })
    .getByRole("button", { name: "Open navigation", exact: true });

const expectNoFindings = async (builder: AxeBuilder) => {
  const { violations, incomplete } = await builder.withTags(AXE_TAGS).analyze();
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
    test(`axe finds nothing on the app shell page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectNoFindings(new AxeBuilder({ page }));
    });

    test(`axe finds nothing on the narrow app shell page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale, NARROW);
      await expectNoFindings(new AxeBuilder({ page }));
    });

    test(`axe finds nothing in the open drawer in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale, NARROW);
      await frameOpener(page).click();
      await settled(page);
      await expectNoFindings(new AxeBuilder({ page }).include('[role="dialog"]'));
    });
  }

test("the page holds one main landmark and no second skip link", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveCount(0);
});

test("the sidebar is a column from 768 px up and the header's button hides with it", async ({
  page,
}) => {
  await open(page, "light", "en", WIDE);
  const frame = page.getByRole("region", { name: "Frame" });
  await expect(frame.getByRole("navigation", { name: "Frame navigation" })).toBeVisible();
  await expect(frameOpener(page)).toBeHidden();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(frame.getByRole("navigation", { name: "Frame navigation" })).toBeVisible();
  await page.setViewportSize({ width: 767, height: 800 });
  await expect(frame.getByRole("navigation", { name: "Frame navigation" })).toBeHidden();
  await expect(frameOpener(page)).toBeVisible();
});

test("collapseBelow xl shows the column from 1280 px and uses the drawer below", async ({
  page,
}) => {
  await open(page, "light", "en", WIDE);
  const breakpoint = page.getByRole("region", { name: "Collapse breakpoint" });
  const column = breakpoint.getByRole("navigation", { name: "Breakpoint navigation" });
  await expect(column).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(column).toBeHidden();
  await expect(breakpoint.getByRole("button", { name: "Open navigation" })).toBeVisible();
});

test("the folding toggle of the column narrows it to the rail", async ({ page }) => {
  await open(page, "light", "en");
  const frame = page.getByRole("region", { name: "Frame" });
  const nav = frame.getByRole("navigation", { name: "Frame navigation" });
  const root = nav.locator("xpath=..");
  expect((await boxOf(root)).width).toBeCloseTo(256, 0);
  await frame.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect.poll(async () => (await boxOf(root)).width).toBeCloseTo(64, 0);
});

test("the shell's page is inside its region, under the section's heading", async ({ page }) => {
  await open(page, "light", "en");
  const frame = page.getByRole("region", { name: "Frame" });
  await expect(
    frame.locator("#app-shell-frame-main").getByRole("heading", { level: 3 }),
  ).toHaveText("Orders");
});

test("the drawer is a dialog named for navigation with the sidebar in full and no toggle", async ({
  page,
}) => {
  await open(page, "light", "en", NARROW);
  await frameOpener(page).click();
  const dialog = await settled(page);
  await expect(dialog).toHaveAttribute("role", "dialog");
  await expect(dialog).toHaveAccessibleName("Navigation menu");
  await expect(dialog.getByRole("navigation", { name: "Frame navigation" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Collapse sidebar" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();
});

test("opening by keyboard moves focus inside, hides the page, traps Tab, and Escape returns focus", async ({
  page,
}) => {
  await open(page, "light", "en", NARROW);
  const opener = frameOpener(page);
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = await settled(page);
  expect(await isFocusInside(dialog)).toBe(true);
  // React Aria hides the page behind an open drawer from assistive technology.
  await expect(page.getByRole("heading", { level: 1, name: "App shell" })).toHaveCount(0);
  for (let step = 0; step < 10; step += 1) {
    await page.keyboard.press("Tab");
    expect(await isFocusInside(dialog), `Tab ${step + 1}`).toBe(true);
  }
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await isFocusInside(dialog), `Shift+Tab ${step + 1}`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: "App shell" })).toBeVisible();
});

test("a press on the backdrop closes the drawer and returns focus to the button", async ({
  page,
}) => {
  await open(page, "light", "en", NARROW);
  await frameOpener(page).click();
  const dialog = await settled(page);
  // The dialog is on the start edge, so the window's far edge is the backdrop.
  await page.mouse.click(NARROW.width - 6, 400);
  await expect(dialog).toBeHidden();
  await expect(frameOpener(page)).toBeFocused();
});

test("the Close button closes the drawer and returns focus to the button", async ({ page }) => {
  await open(page, "light", "en", NARROW);
  await frameOpener(page).click();
  const dialog = await settled(page);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(frameOpener(page)).toBeFocused();
});

test("choosing an entry closes the drawer and returns focus to the button", async ({ page }) => {
  await open(page, "light", "en", NARROW);
  await frameOpener(page).click();
  const dialog = await settled(page);
  await dialog.getByRole("link", { name: "Customers" }).click();
  await expect(dialog).toBeHidden();
  await expect(frameOpener(page)).toBeFocused();
});

for (const locale of LOCALES)
  test(`the drawer sits on the start edge in ${locale}`, async ({ page }) => {
    await open(page, "light", locale, NARROW);
    await frameOpener(page).click();
    const dialog = await settled(page);
    const box = await boxOf(dialog);
    if (locale === "en") expect(box.x).toBeCloseTo(0, 0);
    else expect(box.x + box.width).toBeCloseTo(NARROW.width, 0);
    expect(box.height).toBeCloseTo(NARROW.height, 0);
  });

test("the live shell opens its drawer on a wide window too and reports the state", async ({
  page,
}) => {
  await open(page, "light", "en", WIDE);
  const live = page.getByRole("region", { name: "Try it" });
  await expect(page.getByTestId("drawer-state")).toHaveText("Drawer: closed");
  const opener = live.getByRole("button", { name: "Open navigation", exact: true });
  await expect(opener).toBeVisible();
  await opener.click();
  const dialog = await settled(page);
  await expect(page.getByTestId("drawer-state")).toHaveText("Drawer: open");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("drawer-state")).toHaveText("Drawer: closed");
  await expect(opener).toBeFocused();
});

test("a shell with no sidebar has no navigation and no button", async ({ page }) => {
  await open(page, "light", "en", NARROW);
  const bare = page.getByRole("region", { name: "Without a sidebar" });
  await expect(bare.getByRole("navigation")).toHaveCount(0);
  await expect(bare.getByRole("button")).toHaveCount(0);
  await expect(bare.getByRole("heading", { level: 3, name: "Dashboard" })).toBeVisible();
});

test("the Arabic shell puts its column at the right", async ({ page }) => {
  await open(page, "light", "en", WIDE);
  const region = page.getByRole("region", { name: "Arabic" });
  const nav = region.getByRole("navigation", { name: "تنقل الإطار" });
  const content = region.locator("#app-shell-arabic-main");
  expect((await boxOf(nav)).x).toBeGreaterThan((await boxOf(content)).x);
});

test("the opener and the drawer's buttons are at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en", NARROW);
  const opener = await boxOf(frameOpener(page));
  expect(opener.width).toBeGreaterThanOrEqual(24);
  expect(opener.height).toBeGreaterThanOrEqual(24);
  await frameOpener(page).click();
  const dialog = await settled(page);
  const close = await boxOf(dialog.getByRole("button", { name: "Close", exact: true }));
  expect(close.width).toBeGreaterThanOrEqual(24);
  expect(close.height).toBeGreaterThanOrEqual(24);
});
