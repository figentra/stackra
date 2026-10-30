/**
 * Stackra file contract:
 * Purpose: the leave-confirmation route's own end-to-end checks: axe finds nothing (violations or incomplete) on the
 *          page and inside the open dialog in light, dark, left-to-right and right-to-left; leaving costs nothing while
 *          the note is saved; with unsaved changes the dialog is named by its question, starts focus on Stay, keeps the
 *          note on Stay and Escape, drops it on Discard, and returns focus to the button that asked; the browser is
 *          asked to hold the tab back only while there are unsaved changes; and the dialog's buttons are at least 24
 *          by 24 CSS pixels (WCAG 2.2 SC 2.5.8).
 * Boundary: the production build under `vite preview`; Chromium only. `beforeunload` is dispatched as a cancelable
 *           event, because a real unload prompt cannot be answered from a test. React Aria hides everything outside an
 *           open dialog from the accessibility tree, so role queries run inside the dialog while it is open and on the
 *           page only after it has closed; axe inside an open dialog is scoped to the dialog for the same reason.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test placement); WCAG 2.2
 *          SC 2.1.1, 2.4.3, 2.5.8, 3.3.4 and 4.1.2.
 */
// @covers sta-350:FR-105 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/leave-confirmation?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Leave confirmation", locale) }),
  ).toBeVisible();
};

/** The Usage example: its note, its Save and Leave buttons (by position: the Arabic page translates them) and its answer. */
const usage = (page: Page) => {
  const section = example(page, "usage");
  return {
    note: section.getByRole("textbox"),
    save: section.getByRole("listitem").nth(0).getByRole("button"),
    leave: section.getByRole("listitem").nth(1).getByRole("button"),
    status: section.getByRole("status"),
  };
};

/** Types into the Usage note and tries to leave, returning the dialog that opens. */
const tryToLeave = async (page: Page) => {
  await usage(page).note.fill("Draft");
  await usage(page).leave.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

/** Dispatches `beforeunload` in the page and says whether it asked the browser to hold the user back. */
const isHeldBack = (page: Page) =>
  page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });

/**
 * Hides the page behind the overlay while it is scanned, and shows it again. Axe reads the elements under a see-through
 * backdrop as part of the text's background, and a page that differs from one line of text to the next leaves the
 * contrast check "for review"; the overlay's own colours are what is scanned, and the page has its own axe tests.
 */
const setPageHidden = (page: Page, isHidden: boolean) =>
  page.evaluate((hide) => {
    const root = document.getElementById("root");
    if (root) root.style.visibility = hide ? "hidden" : "";
  }, isHidden);

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
    test(`axe finds nothing on the leave-confirmation page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectNothing(page);
    });

    test(`axe finds nothing inside the open dialog in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await tryToLeave(page);
      await setPageHidden(page, true);
      await expectNothing(page, '[role="alertdialog"]');
    });
  }

test("leaving costs nothing while the note is saved", async ({ page }) => {
  await open(page, "light", "en");
  const status = usage(page).status;
  await usage(page).leave.click();
  await expect(status).toHaveText("You left the page.");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  await usage(page).note.fill("Draft");
  await usage(page).save.click();
  await usage(page).leave.click();
  await expect(status).toHaveText("You left the page.");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(usage(page).note).toHaveValue("Draft");
});

test("the dialog is named by its question, and focus starts on Stay", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await tryToLeave(page);
  await expect(dialog).toHaveAccessibleName("Discard unsaved changes?");
  await expect(dialog).toHaveAccessibleDescription("Your edits to this note will be lost.");
  await expect(dialog.getByRole("button", { name: "Stay on page" })).toBeFocused();
});

test("Stay and Escape keep the note and return focus to the button that asked", async ({
  page,
}) => {
  await open(page, "light", "en");
  const status = usage(page).status;
  const first = await tryToLeave(page);
  await first.getByRole("button", { name: "Stay on page" }).click();
  await expect(first).toBeHidden();
  await expect(status).toHaveText("You stayed on the page.");
  await expect(usage(page).note).toHaveValue("Draft");
  await expect(usage(page).leave).toBeFocused();

  await usage(page).leave.click();
  const second = page.getByRole("alertdialog");
  await expect(second).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(second).toBeHidden();
  await expect(status).toHaveText("You stayed on the page.");
  await expect(usage(page).note).toHaveValue("Draft");
  await expect(usage(page).leave).toBeFocused();
});

test("Discard leaves the page and drops the note", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await tryToLeave(page);
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Discard changes" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(usage(page).status).toHaveText("You left the page.");
  await expect(usage(page).note).toHaveValue("");
});

test("the browser is asked to hold the tab back only while there are unsaved changes", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The Last answer example opens with a draft of its own: the page is held back until it is saved. It loads lazily,
  // so its Save button is waited for before the first check.
  const saveAnswer = example(page, "answer").getByRole("button", { name: "Save", exact: true });
  await expect(saveAnswer).toBeVisible();
  expect(await isHeldBack(page)).toBe(true);
  await saveAnswer.click();
  expect(await isHeldBack(page)).toBe(false);
  await usage(page).note.fill("Draft");
  expect(await isHeldBack(page)).toBe(true);
  await usage(page).save.click();
  expect(await isHeldBack(page)).toBe(false);
});

test("the dialog's buttons are at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await tryToLeave(page);
  for (const name of ["Stay on page", "Discard changes"]) {
    const box = await dialog.getByRole("button", { name }).boundingBox();
    if (!box) throw new Error(`${name} has no box`);
    expect(box.width, name).toBeGreaterThanOrEqual(24);
    expect(box.height, name).toBeGreaterThanOrEqual(24);
  }
});
