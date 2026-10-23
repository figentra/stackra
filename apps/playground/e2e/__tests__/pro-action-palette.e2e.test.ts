/**
 * Stackra file contract:
 * Purpose: the ActionPalette page in Chromium: the palette opens from its button and from Ctrl with K, puts focus in its
 *          search field, filters as you type and says so when nothing matches, runs an action from the pointer and
 *          from the keyboard, closes on Escape and returns focus to the button, and passes axe while open, in light and
 *          dark.
 * Boundary: the production build under `vite preview`; Chromium only. HeroUI Pro's palette has no shortcut of its own;
 *          the page binds Ctrl or Cmd with K, and the test presses Control.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeFindings, SCHEMES, visit } from "../support/pro-page";

const PATH = "/pro-action-palette";

const trigger = (page: Page) => page.getByRole("button", { name: /Open action palette/ });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Action palette" });
const search = (page: Page) => dialog(page).getByRole("searchbox", { name: "Search actions" });
const items = (page: Page) => dialog(page).getByRole("menuitem");

// Focus the button as a keyboard user does. A bare `focus()` leaves React Aria in its "virtual" modality (a screen reader's
// focus), where the palette waits for the active element to hold still before it focuses the search, and the first
// Ctrl with K from a focused element never reaches it.
async function focusTriggerByKeyboard(page: Page) {
  await trigger(page).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
}

test("opens from its button, focuses the search, and filters as you type", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(dialog(page)).toBeHidden();
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
  await expect(items(page)).toHaveCount(6);
  for (const heading of ["Navigate", "Create", "Settings"])
    await expect(dialog(page).getByText(heading, { exact: true })).toBeVisible();

  await search(page).pressSequentially("invoice");
  await expect(items(page)).toHaveText(["Go to invoices", "Create invoice"]);

  await search(page).fill("zzz");
  await expect(dialog(page).getByText("No actions match.")).toBeVisible();
});

test("closes on Escape and returns focus to the button", async ({ page }) => {
  await visit(page, PATH, "light");
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("opens from Ctrl with K, and Escape returns focus to where it was", async ({ page }) => {
  await visit(page, PATH, "light");
  await focusTriggerByKeyboard(page);
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("runs an action from a press: the palette closes and the action is reported", async ({
  page,
}) => {
  await visit(page, PATH, "light");
  await expect(page.getByRole("status")).toHaveText("No action has run yet.");
  await trigger(page).click();
  await items(page).filter({ hasText: "Invite teammate" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("Last action: Invite teammate");
  await expect(trigger(page)).toBeFocused();
});

test("runs an action from the keyboard", async ({ page }) => {
  await visit(page, PATH, "light");
  await focusTriggerByKeyboard(page);
  await page.keyboard.press("Control+k");
  await search(page).pressSequentially("preferences");
  await expect(items(page)).toHaveText(["Open preferences"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("Last action: Open preferences");
});

for (const scheme of SCHEMES)
  test(`passes axe while open, in ${scheme}`, async ({ page }) => {
    await visit(page, PATH, scheme);
    await trigger(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(items(page)).toHaveCount(6);
    await expectNoAxeFindings(page);
  });
