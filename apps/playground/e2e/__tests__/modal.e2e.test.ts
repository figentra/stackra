/**
 * Stackra file contract:
 * Purpose: the modal route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page and in the
 *          open dialog in light, dark, left-to-right and right-to-left; opening by keyboard moves focus into the
 *          dialog, hides the page behind it from assistive technology and traps Tab and Shift+Tab, and closing returns
 *          focus to the trigger; the dialog is named by its title; a press outside and Escape close the default modal,
 *          while outside press off and Escape off each refuse only their own way; the sizes widen in order and full
 *          fills the window; the positions pin the dialog to the top, middle and bottom; a long body scrolls under the
 *          keyboard while the header and footer stay in view; the live example keeps the name on Save and returns
 *          focus to its button; and the close button and the footer actions sit at the reading-end side in both
 *          directions, each at least 24 by 24 CSS pixels (WCAG 2.2 SC 2.5.8).
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           modal from the accessibility tree, so role queries outside one find nothing: CSS locators and `getByRole`
 *           on the trigger after it closes are used there. Axe scans the open dialog alone, because the page behind it
 *           is deliberately hidden and the page-level rules belong to the closed page.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.2, 2.4.3, 2.5.8
 *          and 4.1.2; ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-101 sta-350:SC-008 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/modal?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Modal" })).toBeVisible();
};

/** Waits until the open modal has finished entering, so axe and the boxes see its final state. */
const settled = async (page: Page) => {
  const dialog = page.locator('[data-slot="modal-dialog"]');
  await expect(dialog).toBeVisible();
  for (const slot of ["modal-backdrop", "modal-container"])
    await expect(page.locator(`[data-slot="${slot}"]`)).not.toHaveAttribute(
      "data-entering",
      "true",
    );
  return dialog;
};

/** Presses the trigger with the pointer and waits for the dialog. */
const openDialog = async (page: Page, trigger: string) => {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  return settled(page);
};

/** Gives a refused dismissal time to have closed the dialog, so "still open" is a fact and not a race. */
const settle = (page: Page) => page.waitForTimeout(300);

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

const isFocusInside = (dialog: Locator) =>
  dialog.evaluate((element) => element.contains(document.activeElement));

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
    test(`axe finds nothing on the modal page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectNoFindings(new AxeBuilder({ page }));
    });

    test(`axe finds nothing in the open modal in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await openDialog(page, "Open medium");
      await expectNoFindings(new AxeBuilder({ page }).include('[role="dialog"]'));
    });
  }

test("axe finds nothing in the live form modal or the long modal", async ({ page }) => {
  await open(page, "light", "en");
  await openDialog(page, "Edit name");
  await expectNoFindings(new AxeBuilder({ page }).include('[role="dialog"]'));
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="modal-dialog"]')).toBeHidden();
  await openDialog(page, "Open long content");
  await expectNoFindings(new AxeBuilder({ page }).include('[role="dialog"]'));
});

test("the dialog is named by its level-2 title", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open medium");
  await expect(dialog).toHaveAttribute("role", "dialog");
  await expect(dialog).toHaveAccessibleName("Modal size");
  await expect(dialog.getByRole("heading", { level: 2, name: "Modal size" })).toBeVisible();
});

test("opening by keyboard moves focus inside, hides the page, traps Tab, and closing returns focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page.getByRole("button", { name: "Open medium", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = await settled(page);
  expect(await isFocusInside(dialog)).toBe(true);
  // React Aria hides the page behind an open modal from assistive technology.
  await expect(page.getByRole("heading", { level: 1, name: "Modal" })).toHaveCount(0);
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    expect(await isFocusInside(dialog), `Tab ${step + 1}`).toBe(true);
  }
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await isFocusInside(dialog), `Shift+Tab ${step + 1}`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: "Modal" })).toBeVisible();
});

test("the default modal closes on a press outside it and returns focus to its trigger", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open default");
  // The corner of the window is on the backdrop, outside the dialog.
  await page.mouse.click(6, 6);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Open default", exact: true })).toBeFocused();
});

test("with outside press off a press outside leaves the modal open, and Escape and Cancel still close it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open with outside press off");
  await page.mouse.click(6, 6);
  await settle(page);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await openDialog(page, "Open with outside press off");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("with Escape off the key leaves the modal open, and a press outside and Close still close it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open with Escape off");
  await page.keyboard.press("Escape");
  await settle(page);
  await expect(dialog).toBeVisible();
  await page.mouse.click(6, 6);
  await expect(dialog).toBeHidden();
  await openDialog(page, "Open with Escape off");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
});

test("the sizes widen in order, and full fills the window", async ({ page }) => {
  await open(page, "light", "en");
  const widths: Record<string, number> = {};
  for (const [trigger, key] of [
    ["Open small", "sm"],
    ["Open medium", "md"],
    ["Open large", "lg"],
  ] as const) {
    const dialog = await openDialog(page, trigger);
    widths[key] = (await boxOf(dialog)).width;
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  expect(widths["sm"]).toBeLessThan(widths["md"] ?? 0);
  expect(widths["md"]).toBeLessThan(widths["lg"] ?? 0);
  const full = await openDialog(page, "Open full");
  const box = await boxOf(full);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
});

test("the positions pin the dialog to the top, the middle and the bottom", async ({ page }) => {
  await open(page, "light", "en");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  const middle = viewport.height / 2;
  for (const [trigger, place] of [
    ["Open top", "top"],
    ["Open centre", "center"],
    ["Open bottom", "bottom"],
    // On a window wider than the small breakpoint, auto is centred.
    ["Open auto", "center"],
  ] as const) {
    const dialog = await openDialog(page, trigger);
    const box = await boxOf(dialog);
    // The container keeps 40 px of padding on a window wider than the small breakpoint.
    if (place === "top") expect(box.y, trigger).toBeLessThan(80);
    else if (place === "bottom")
      expect(box.y + box.height, trigger).toBeGreaterThan(viewport.height - 80);
    else expect(Math.abs(box.y + box.height / 2 - middle), trigger).toBeLessThan(4);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});

test("a long body scrolls under the keyboard while the header and footer stay in view", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open long content");
  const body = dialog.locator('[data-slot="modal-body"]');
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await body.focus();
  await page.keyboard.press("PageDown");
  expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.getByRole("heading", { level: 2, name: "Terms of use" })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Done" })).toBeInViewport();
});

test("the live example keeps the name on Save, returns focus to its button, and Cancel keeps the old name", async ({
  page,
}) => {
  await open(page, "light", "en");
  const edit = page.getByRole("button", { name: "Edit name", exact: true });
  const status = page.getByRole("status");
  await expect(status).toHaveText("Current name: Ada Lovelace");
  await edit.focus();
  await page.keyboard.press("Enter");
  const dialog = await settled(page);
  const field = dialog.getByRole("textbox", { name: "Full name" });
  await field.fill("Grace Hopper");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(status).toHaveText("Current name: Ada Lovelace");
  await expect(edit).toBeFocused();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(field).toHaveValue("Ada Lovelace");
  await field.fill("Grace Hopper");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(status).toHaveText("Current name: Grace Hopper");
  await expect(edit).toBeFocused();
});

for (const locale of LOCALES)
  test(`the close button and the footer actions sit at the reading-end side in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const dialog = await openDialog(page, "Open medium");
    const box = await boxOf(dialog);
    const close = await boxOf(dialog.getByRole("button", { name: "Close", exact: true }));
    const cancel = await boxOf(dialog.getByRole("button", { name: "Cancel", exact: true }));
    const middle = box.x + box.width / 2;
    for (const [name, part] of [
      ["close button", close],
      ["Cancel", cancel],
    ] as const) {
      const centre = part.x + part.width / 2;
      if (locale === "en") expect(centre, name).toBeGreaterThan(middle);
      else expect(centre, name).toBeLessThan(middle);
    }
  });

test("every close and footer button is at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Open medium");
  for (const name of ["Close", "Cancel"]) {
    const box = await boxOf(dialog.getByRole("button", { name, exact: true }));
    expect(box.width, name).toBeGreaterThanOrEqual(24);
    expect(box.height, name).toBeGreaterThanOrEqual(24);
  }
});
