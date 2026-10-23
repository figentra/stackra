/**
 * Stackra file contract:
 * Purpose: the DataGrid page in Chromium: a column header sorts the grid on a press and reverses it on the next (the
 *          amount sorts as a number), a header sorts from the keyboard, rows select and the count follows, select-all
 *          selects every row, and the page passes axe after sorting and selecting, in light and dark.
 * Boundary: the production build under `vite preview`; Chromium only. The closed, default state is covered in all four
 *          scheme and direction combinations by `playground.e2e.test.ts`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeFindings, SCHEMES, visit } from "../support/pro-page";

const PATH = "/pro-data-grid";

const grid = (page: Page) => page.getByRole("grid", { name: "Invoices" });
const customers = (page: Page) => grid(page).getByRole("rowheader");
const row = (page: Page, customer: string) =>
  grid(page).getByRole("row").filter({ hasText: customer });

test("a header press sorts the grid, and the next press reverses it", async ({ page }) => {
  await visit(page, PATH, "light");
  const customer = grid(page).getByRole("columnheader", { name: /Customer/ });
  const amount = grid(page).getByRole("columnheader", { name: /Amount/ });
  await expect(customer).toHaveAttribute("aria-sort", "ascending");
  await expect(customers(page).first()).toHaveText("Ada Lovelace");

  await amount.click();
  await expect(amount).toHaveAttribute("aria-sort", "ascending");
  await expect(customer).not.toHaveAttribute("aria-sort", "ascending");
  await expect(customers(page).first()).toHaveText("Barbara Liskov"); // 15: a number, not text, order
  await expect(customers(page).last()).toHaveText("Alan Turing"); // 3,200

  await amount.click();
  await expect(amount).toHaveAttribute("aria-sort", "descending");
  await expect(customers(page).first()).toHaveText("Alan Turing");
});

test("a header sorts from the keyboard", async ({ page }) => {
  await visit(page, PATH, "light");
  const customer = grid(page).getByRole("columnheader", { name: /Customer/ });
  await customer.focus();
  await page.keyboard.press("Enter");
  await expect(customer).toHaveAttribute("aria-sort", "descending");
  await expect(customers(page).first()).toHaveText("Margaret Hamilton");
});

test("rows select, and the count follows", async ({ page }) => {
  await visit(page, PATH, "light");
  const status = page.getByRole("status");
  await expect(status).toHaveText("0 of 6 selected");

  await row(page, "Grace Hopper").getByRole("checkbox").click();
  await expect(row(page, "Grace Hopper")).toHaveAttribute("aria-selected", "true");
  await expect(status).toHaveText("1 of 6 selected");

  await grid(page)
    .getByRole("checkbox", { name: /select all/i })
    .click();
  await expect(status).toHaveText("6 of 6 selected");
});

for (const scheme of SCHEMES)
  test(`passes axe after sorting and selecting, in ${scheme}`, async ({ page }) => {
    await visit(page, PATH, scheme);
    await grid(page)
      .getByRole("columnheader", { name: /Amount/ })
      .click();
    await row(page, "Ada Lovelace").getByRole("checkbox").click();
    await expect(page.getByRole("status")).toHaveText("1 of 6 selected");
    await expectNoAxeFindings(page);
  });
