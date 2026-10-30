/**
 * Stackra file contract:
 * Purpose: the alert-dialog route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page and
 *          inside an open dialog in light, dark, left-to-right and right-to-left; the dialog is named by its title and
 *          described by its description; focus starts on Cancel, stays inside on Tab and Shift+Tab, and returns to
 *          the button that opened it; Escape refuses unless it is disabled; a press outside answers only where it is
 *          on; Enter on the focused confirm button answers; the buttons are at least 24 by 24 CSS pixels (WCAG 2.2
 *          SC 2.5.8) and sit in the reading order in both directions; and the icon is hidden from assistive technology.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           dialog from the accessibility tree, so role queries run inside the dialog while it is open and on the page
 *           only after it has closed; axe inside an open dialog is scoped to the dialog for the same reason.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3, 2.5.8 and 4.1.2.
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
  await page.goto(`/alert-dialog?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Alert dialog", locale) }),
  ).toBeVisible();
};

/** Opens the dialog of a sample by its button in the example `id` and waits for the dialog, named by its title. */
const openDialog = async (page: Page, trigger: string, title: string, id = "usage") => {
  await example(page, id).getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: title });
  await expect(dialog).toBeVisible();
  return dialog;
};

/** Opens the danger sample, the fifth of Usage, by position: the Arabic page translates its words. */
const openDanger = async (page: Page) => {
  await example(page, "usage").getByRole("listitem").nth(4).getByRole("button").click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

/** The status line of an example, where its last answer is reported. */
const statusOf = (page: Page, id: string) => example(page, id).getByRole("status");

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
    test(`axe finds nothing on the alert-dialog page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectNothing(page);
    });

    test(`axe finds nothing inside an open dialog in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await openDanger(page);
      await expectNothing(page, '[role="alertdialog"]');
    });
  }

test("the dialog is named by its title and described by its description", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Danger tone", "Delete this project?");
  await expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  // Decorative: the title and the button labels carry the meaning, so the icon says nothing to a screen reader.
  await expect(dialog.locator('[data-slot="alert-dialog-icon"] svg')).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("focus starts on Cancel, stays inside on Tab, and returns to the opening button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Danger tone", "Delete this project?");
  const keep = dialog.getByRole("button", { name: "Keep project" });
  const remove = dialog.getByRole("button", { name: "Delete project" });
  await expect(keep).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(remove).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(keep).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(remove).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    example(page, "usage").getByRole("button", { name: "Danger tone", exact: true }),
  ).toBeFocused();
});

test("Enter on the focused confirm button answers, and Cancel refuses", async ({ page }) => {
  await open(page, "light", "en");
  const status = statusOf(page, "usage");
  await expect(status).toHaveText("No answer yet.");

  const dialog = await openDialog(page, "Warning tone", "Close the project with open tasks?");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close project" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(status).toHaveText("Warning tone: confirmed.");

  const second = await openDialog(page, "Warning tone", "Close the project with open tasks?");
  await second.getByRole("button", { name: "Keep it open" }).click();
  await expect(second).toBeHidden();
  await expect(status).toHaveText("Warning tone: cancelled.");
});

test("Escape refuses, and does nothing where it is disabled", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await openDialog(page, "Success tone", "Mark the order as shipped?");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(statusOf(page, "usage")).toHaveText("Success tone: cancelled.");

  const locked = await openDialog(page, "Escape disabled", "Accept the new terms?", "dismissal");
  await page.keyboard.press("Escape");
  // A beat for a close that would be wrongly under way, then the dialog is still there.
  await page.waitForTimeout(300);
  await expect(locked).toBeVisible();
  await locked.getByRole("button", { name: "Decline" }).click();
  await expect(locked).toBeHidden();
  await expect(statusOf(page, "dismissal")).toHaveText("Escape disabled: cancelled.");
});

test("a press outside answers only where it is turned on", async ({ page }) => {
  await open(page, "light", "en");
  const status = statusOf(page, "dismissal");
  const plain = await openDialog(page, "Danger tone", "Delete this project?");
  await page.mouse.click(4, 4);
  await page.waitForTimeout(300);
  await expect(plain).toBeVisible();
  await plain.getByRole("button", { name: "Keep project" }).click();
  await expect(plain).toBeHidden();

  const dismissable = await openDialog(
    page,
    "Press outside answers",
    "Leave this team?",
    "dismissal",
  );
  await page.mouse.click(4, 4);
  await expect(dismissable).toBeHidden();
  await expect(status).toHaveText("Press outside answers: cancelled.");
});

test("every tone, an icon of its own and none open with the right mark", async ({ page }) => {
  await open(page, "light", "en");
  const samples = [
    ["Default tone", "Publish this page?", "default"],
    ["Accent tone", "Invite the whole team?", "accent"],
    ["Success tone", "Mark the order as shipped?", "success"],
    ["Warning tone", "Close the project with open tasks?", "warning"],
    ["Danger tone", "Delete this project?", "danger"],
  ] as const;
  for (const [trigger, title, tone] of samples) {
    const dialog = await openDialog(page, trigger, title);
    await expect(dialog.locator('[data-slot="alert-dialog-icon"]')).toHaveClass(
      new RegExp(`alert-dialog__icon--${tone}`),
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  const custom = await openDialog(page, "Custom icon", "Empty the trash?", "icons");
  await expect(custom.locator('[data-slot="alert-dialog-icon"] svg.lucide-trash')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(custom).toBeHidden();

  const bare = await openDialog(page, "No icon", "Sign out of every device?", "icons");
  await expect(bare.locator('[data-slot="alert-dialog-icon"]')).toHaveCount(0);
});

test("the buttons are at least 24 by 24 pixels and follow the reading order", async ({ page }) => {
  for (const locale of LOCALES) {
    await open(page, "light", locale);
    const dialog = await openDanger(page);
    // Keep project, then Delete project, in the document's order.
    const keep = await dialog.getByRole("button").nth(0).boundingBox();
    const remove = await dialog.getByRole("button").nth(1).boundingBox();
    if (!keep || !remove) throw new Error("a dialog button has no box");
    for (const box of [keep, remove]) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
    // Cancel comes first in the reading order: left of Delete in English, right of it in Arabic.
    if (locale === "en") expect(keep.x).toBeLessThan(remove.x);
    else expect(keep.x).toBeGreaterThan(remove.x);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});
