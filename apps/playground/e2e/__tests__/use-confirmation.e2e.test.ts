/**
 * Stackra file contract:
 * Purpose: the use-confirmation route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page
 *          and inside the open typed dialog in light, dark, left-to-right and right-to-left; a question resolves true on
 *          confirm and false on Cancel and Escape; the confirming button of the typed question is disabled until the
 *          name is typed exactly, and the counter moves only when it is confirmed; the field is named by its label; and
 *          focus starts on Cancel and returns to the button that asked.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           dialog from the accessibility tree, so role queries run inside the dialog while it is open and on the page
 *           only after it has closed; axe inside an open dialog is scoped to the dialog for the same reason.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test placement); WCAG 2.2
 *          SC 2.1.1, 2.4.3, 3.3.4 and 4.1.2.
 */
// @covers sta-350:FR-105 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/use-confirmation?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "useConfirmation" })).toBeVisible();
};

/** Presses the button of a question and waits for the dialog, named by its title. */
const ask = async (page: Page, trigger: string, title: string) => {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: title });
  await expect(dialog).toBeVisible();
  return dialog;
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
    test(`axe finds nothing on the use-confirmation page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectNothing(page);
    });

    test(`axe finds nothing inside the open typed dialog in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await ask(page, "Delete workspace", "Delete the Acme workspace?");
      await expectNothing(page, '[role="alertdialog"]');
    });
  }

test("a question resolves true on confirm and false on Cancel and Escape", async ({ page }) => {
  await open(page, "light", "en");
  const status = page.getByRole("region", { name: "Last answer" }).getByRole("status");
  await expect(status).toHaveText("No answer yet.");

  const first = await ask(page, "Archive project", "Archive this project?");
  await first.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(first).toBeHidden();
  await expect(status).toHaveText("Archive project: confirmed.");

  const second = await ask(page, "Archive project", "Archive this project?");
  await second.getByRole("button", { name: "Keep active" }).click();
  await expect(second).toBeHidden();
  await expect(status).toHaveText("Archive project: declined.");

  const third = await ask(page, "Archive project", "Archive this project?");
  await page.keyboard.press("Escape");
  await expect(third).toBeHidden();
  await expect(status).toHaveText("Archive project: declined.");
});

test("focus starts on Cancel and returns to the button that asked", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await ask(page, "Delete project", "Delete this project?");
  await expect(dialog.getByRole("button", { name: "Keep project" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Delete project", exact: true })).toBeFocused();
});

test("the typed question stays locked until the name is typed exactly", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await ask(page, "Delete workspace", "Delete the Acme workspace?");
  const confirm = dialog.getByRole("button", { name: "Delete Acme" });
  const field = dialog.getByRole("textbox", { name: 'Type "Acme" to confirm' });
  await expect(confirm).toBeDisabled();

  await field.fill("acme");
  await expect(confirm).toBeDisabled();
  await field.fill("Acm");
  await expect(confirm).toBeDisabled();
  await field.fill("Acme");
  await expect(confirm).toBeEnabled();
});

test("the counter moves only when the typed deletion is confirmed", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByText("Workspaces deleted: 0.")).toBeVisible();

  const refused = await ask(page, "Delete workspace", "Delete the Acme workspace?");
  await refused.getByRole("button", { name: "Keep Acme" }).click();
  await expect(refused).toBeHidden();
  await expect(page.getByText("Workspaces deleted: 0.")).toBeVisible();

  // Each question starts with an empty field, so the name typed for the first one does not carry over.
  const confirmed = await ask(page, "Delete workspace", "Delete the Acme workspace?");
  await expect(confirmed.getByRole("textbox")).toHaveValue("");
  await confirmed.getByRole("textbox").fill("Acme");
  await confirmed.getByRole("button", { name: "Delete Acme" }).click();
  await expect(confirmed).toBeHidden();
  await expect(page.getByText("Workspaces deleted: 1.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Last answer" }).getByRole("status")).toHaveText(
    "Delete workspace: confirmed.",
  );
});

test("the dialog's buttons are at least 24 by 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const dialog = await ask(page, "Delete workspace", "Delete the Acme workspace?");
  for (const name of ["Keep Acme", "Delete Acme"]) {
    const box = await dialog.getByRole("button", { name }).boundingBox();
    if (!box) throw new Error(`${name} has no box`);
    expect(box.width, name).toBeGreaterThanOrEqual(24);
    expect(box.height, name).toBeGreaterThanOrEqual(24);
  }
});
