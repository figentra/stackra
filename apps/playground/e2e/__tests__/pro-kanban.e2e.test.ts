/**
 * Stackra file contract:
 * Purpose: the Kanban page in Chromium: three named columns each show their cards and count, a card moves to the next
 *          column from its button, which works from the keyboard (the page's non-dragging way, WCAG 2.2 2.5.7), the
 *          counts and the status line follow, and the page passes axe after a move, in light and dark.
 * Boundary: the production build under `vite preview`; Chromium only. HeroUI Pro's own drag and drop is React Aria's
 *          and is not driven here: a pointer drag needs real layout timing, and its keyboard drag has no documented
 *          key sequence in HeroUI Pro.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeFindings, SCHEMES, visit } from "../support/pro-page";

const PATH = "/pro-kanban";
const MOVE = "Move to In progress: Write the release notes";

const column = (page: Page, title: string) =>
  page
    .locator('[data-slot="kanban-column"]')
    .filter({ has: page.getByRole("heading", { level: 3, name: title }) });
const count = (page: Page, title: string) =>
  column(page, title).locator('[data-slot="kanban-column-count"]');
const cards = (page: Page, title: string) =>
  page.getByRole("grid", { name: `${title} cards` }).getByRole("row");

test("shows three named columns with their cards and counts", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(page.getByRole("heading", { level: 3 })).toHaveText([
    "To do",
    "In progress",
    "Done",
  ]);
  for (const title of ["To do", "In progress", "Done"]) {
    await expect(cards(page, title)).toHaveCount(2);
    await expect(count(page, title)).toHaveText("2");
  }
  await expect(cards(page, "To do").first()).toContainText("Write the release notes");
});

test("moves a card to the next column from the keyboard, and the counts follow", async ({
  page,
}) => {
  await visit(page, PATH, "light");
  await page.getByRole("button", { name: MOVE }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("status")).toHaveText(
    "Moved Write the release notes to In progress.",
  );
  await expect(cards(page, "To do")).toHaveCount(1);
  await expect(cards(page, "In progress")).toHaveCount(3);
  await expect(cards(page, "Done")).toHaveCount(2);
  await expect(count(page, "To do")).toHaveText("1");
  await expect(count(page, "In progress")).toHaveText("3");
  await expect(
    cards(page, "In progress").filter({ hasText: "Write the release notes" }),
  ).toHaveCount(1);
});

test("gives the last column no button to move on to", async ({ page }) => {
  await visit(page, PATH, "light");
  await expect(page.getByRole("grid", { name: "Done cards" }).getByRole("button")).toHaveCount(0);
});

for (const scheme of SCHEMES)
  test(`passes axe after a move, in ${scheme}`, async ({ page }) => {
    await visit(page, PATH, scheme);
    await page.getByRole("button", { name: MOVE }).click();
    await expect(cards(page, "In progress")).toHaveCount(3);
    await expectNoAxeFindings(page);
  });
