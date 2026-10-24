/**
 * Stackra file contract:
 * Purpose: the route-overlay route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page
 *          and in each open overlay (modal, sheet, drawer, full screen) in light, dark, left-to-right and right-to-left;
 *          opening by keyboard moves focus into the overlay and Escape closes it and returns focus to the button that
 *          opened it; Tab stays inside; the in-memory route follows each open and close while the playground's own
 *          address bar never changes; the sheet sits on the bottom edge, the drawer on the reading-end edge in both
 *          directions and a narrow window turns the drawer into a bottom sheet; the full-screen overlay fills the
 *          window; the locked overlay refuses Escape and a press outside until dismissal is allowed, and its close
 *          button always works; a `Link` opens an overlay on the client; in the live example Save completes the route
 *          with no question, and Cancel with an unsaved edit asks, keeps the edit on Stay and on Escape, and drops it
 *          on Discard; and every button in an overlay is at least 24 by 24 CSS pixels (WCAG 2.2 SC 2.5.8).
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay from the accessibility tree, so role queries run inside it while it is open and on the page only
 *           after it has closed; the in-memory route is read with a text locator, which ignores `aria-hidden`; axe inside
 *           an open overlay is scoped to it for the same reason.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0312; ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3, 2.5.8, 3.3.4 and 4.1.2.
 */
// @covers sta-350:FR-184 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Each presentation: the button that opens it and the title that names its dialog. */
const OVERLAYS = [
  { button: "Open modal", title: "Modal route" },
  { button: "Open sheet", title: "Sheet route" },
  { button: "Open drawer", title: "Drawer route" },
  { button: "Open full screen", title: "Full-screen route" },
] as const;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/route-overlay?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Route overlay" })).toBeVisible();
};

/** Waits until the open overlay has finished entering, so axe and the boxes see its final state. */
const settled = async (dialog: Locator) => {
  await expect(dialog).toBeVisible();
  await expect(dialog.page().locator('[data-entering="true"]')).toHaveCount(0);
  return dialog;
};

/** Presses a trigger with the pointer and waits for the dialog it opens. */
const openOverlay = async (page: Page, button: string, title: string) => {
  await page.getByRole("button", { name: button, exact: true }).click();
  return settled(page.getByRole("dialog", { name: title }));
};

/** The in-memory route the page shows, read as text because the page is hidden while an overlay is open. */
const routeText = (page: Page) => page.getByText(/^Route: /);

/** Gives a refused dismissal time to have closed the overlay, so "still open" is a fact and not a race. */
const settle = (page: Page) => page.waitForTimeout(300);

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

const expectNothing = async (page: Page, include?: string) => {
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  const { violations, incomplete } = await (include ? builder.include(include) : builder).analyze();
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
    test(`axe finds nothing on the route-overlay page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectNothing(page);
    });

    for (const { button, title } of OVERLAYS)
      test(`axe finds nothing in the ${title} dialog in ${scheme}, ${locale}`, async ({ page }) => {
        await open(page, scheme, locale);
        await openOverlay(page, button, title);
        await expectNothing(page, '[role="dialog"]');
      });
  }

test("opening by keyboard moves focus into the overlay, Escape closes it and focus returns", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page.getByRole("button", { name: "Open modal", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = await settled(page.getByRole("dialog", { name: "Modal route" }));
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await expect(routeText(page)).toHaveText("Route: /modal");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /");
  await expect(trigger).toBeFocused();
});

test("the close button steps back to the page and returns focus to the button that opened it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Open drawer", "Drawer route");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /");
  await expect(page.getByRole("button", { name: "Open drawer", exact: true })).toBeFocused();
});

test("Tab and Shift+Tab stay inside the overlay", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Open modal", "Modal route");
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
  }
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
});

test("the overlay is a child route: the playground's own address bar never changes", async ({
  page,
}) => {
  await open(page, "light", "en");
  const url = page.url();
  const dialog = await openOverlay(page, "Open modal", "Modal route");
  expect(page.url()).toBe(url);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(page.url()).toBe(url);
});

test("a Link opens an overlay on the client and closing returns to the page", async ({ page }) => {
  await open(page, "light", "en");
  let loads = 0;
  page.on("load", () => loads++);
  await page.getByRole("link", { name: "Open the modal through a Link" }).click();
  const dialog = await settled(page.getByRole("dialog", { name: "Modal route" }));
  await expect(routeText(page)).toHaveText("Route: /modal");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /");
  expect(loads).toBe(0);
});

test("the sheet sits on the bottom edge and the full-screen overlay fills the window", async ({
  page,
}) => {
  await open(page, "light", "en");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");

  const sheet = await openOverlay(page, "Open sheet", "Sheet route");
  const sheetBox = await boxOf(sheet);
  expect(sheetBox.y + sheetBox.height).toBeGreaterThanOrEqual(viewport.height - 2);
  expect(sheetBox.width).toBeGreaterThan(viewport.width / 2);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  const full = await openOverlay(page, "Open full screen", "Full-screen route");
  const box = await boxOf(full);
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 2);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height - 2);
});

for (const [locale, edge] of [
  ["en", "right"],
  ["ar", "left"],
] as const)
  test(`the drawer sits on the reading-end edge in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    const drawer = await openOverlay(page, "Open drawer", "Drawer route");
    const box = await boxOf(drawer);
    expect(box.width).toBeLessThan(viewport.width / 2);
    if (edge === "right") expect(box.x + box.width).toBeGreaterThanOrEqual(viewport.width - 2);
    else expect(box.x).toBeLessThanOrEqual(2);
  });

test("a narrow window turns the drawer into a bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await open(page, "light", "en");
  const drawer = await openOverlay(page, "Open drawer", "Drawer route");
  const box = await boxOf(drawer);
  expect(box.y + box.height).toBeGreaterThanOrEqual(798);
  expect(box.width).toBeGreaterThan(300);
  await expect(page.locator('[data-slot="drawer-content"]')).toHaveAttribute(
    "data-placement",
    "bottom",
  );
});

test("the locked overlay refuses Escape and a press outside, and its close button always works", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Open locked overlay", "Locked route");
  await page.keyboard.press("Escape");
  await settle(page);
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await settle(page);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /");
});

test("allowing dismissal again lets Escape close the locked overlay", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Open locked overlay", "Locked route");
  await dialog.getByRole("button", { name: "Allow dismissal", exact: true }).click();
  await expect(dialog.getByText("Escape and a press outside close it again.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Save completes the route with no question and keeps the name", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Edit name", "Edit your name");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByText("Saved name: Grace Hopper")).toBeVisible();
  await expect(routeText(page)).toHaveText("Route: /");
});

test("Cancel with an unsaved edit asks, and Stay and Escape keep the edit", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Edit name", "Edit your name");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  const question = await settled(
    page.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
  );
  await expect(question.getByRole("button", { name: "Stay on page" })).toBeFocused();

  await question.getByRole("button", { name: "Stay on page" }).click();
  await expect(question).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /edit");
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue("Grace Hopper");

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await settled(page.getByRole("alertdialog", { name: "Discard unsaved changes?" }));
  await page.keyboard.press("Escape");
  await expect(question).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /edit");
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue("Grace Hopper");
});

test("Discard leaves the live overlay, drops the edit and returns focus to its button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Edit name", "Edit your name");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
  await page.keyboard.press("Escape");
  const question = await settled(
    page.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
  );
  await question.getByRole("button", { name: "Discard changes" }).click();
  await expect(question).toBeHidden();
  await expect(dialog).toBeHidden();
  await expect(routeText(page)).toHaveText("Route: /");
  await expect(page.getByText("Saved name: Ada Lovelace")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit name", exact: true })).toBeFocused();
});

test("closing the live overlay costs nothing while nothing is edited", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openOverlay(page, "Edit name", "Edit your name");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("the unsaved-changes question passes axe in dark and right-to-left", async ({ page }) => {
  await open(page, "dark", "ar");
  const dialog = await openOverlay(page, "Edit name", "Edit your name");
  await dialog.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
  await page.keyboard.press("Escape");
  await settled(page.getByRole("alertdialog", { name: "Discard unsaved changes?" }));
  await expectNothing(page, '[role="alertdialog"]');
});

test("every button in an overlay is at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  for (const { button, title } of OVERLAYS) {
    const dialog = await openOverlay(page, button, title);
    const buttons = dialog.getByRole("button");
    const count = await buttons.count();
    expect(count, title).toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      const box = await boxOf(buttons.nth(index));
      expect(box.width, `${title} button ${index}`).toBeGreaterThanOrEqual(24);
      expect(box.height, `${title} button ${index}`).toBeGreaterThanOrEqual(24);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});
