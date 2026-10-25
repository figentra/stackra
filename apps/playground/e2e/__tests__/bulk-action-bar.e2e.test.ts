/**
 * Stackra file contract:
 * Purpose: the bulk action bar route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left; each bar is a toolbar named by its label that shows the count and
 *          one button per action; the live count is announced through one polite status that is in the page before it
 *          speaks; the arrow keys move between the toolbar's buttons; a slow action shows itself busy; a failing
 *          action leaves the selection and no error reaches the browser; a refused action says why and is not run;
 *          select all matching is offered only for a fully selected page and turns into select only the rows
 *          shown; an emptied selection moves focus on instead of dropping it; every button is at least 24 px; and the
 *          count sits at the reading-start side of the bar in both directions.
 * Boundary: the production build under `vite preview`; Chromium only. The live example's actions run for a second, and
 *           the checks wait for their reports.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0182 (test tiers);
 *          ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-190 sta-350:FR-192 sta-350:FR-193 sta-350:SC-013
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/bulk-action-bar?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Bulk action bar" })).toBeVisible();
};

const sectionOf = (page: Page, id: string) => page.locator(`section[aria-labelledby="${id}"]`);

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the bulk action bar page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(
        violations.map((finding) => finding.id),
        "axe violations",
      ).toEqual([]);
      expect(
        incomplete.map((finding) => finding.id),
        "axe checks left for review",
      ).toEqual([]);
    });

test("each bar is a named toolbar with the count and a button per action, and none draws nothing", async ({
  page,
}) => {
  await open(page, "light", "en");
  const counts = sectionOf(page, "bulk-action-bar-counts");
  const one = counts.getByRole("toolbar", { name: "Actions, One selected" });
  await expect(one).toContainText("1 selected");
  await expect(one.getByRole("button")).toHaveText(["Archive", "Clear selection"]);
  await expect(counts.getByRole("toolbar", { name: "Actions, Three selected" })).toContainText(
    "3 selected",
  );
  await expect(counts.getByRole("toolbar", { name: "Actions, Nothing selected" })).toHaveCount(0);

  const three = sectionOf(page, "bulk-action-bar-actions").getByRole("toolbar", {
    name: "Actions, Three actions",
  });
  await expect(three.getByRole("button")).toHaveText([
    "Archive",
    "Export",
    "Delete",
    "Clear selection",
  ]);
});

/** Toggles a checkbox from the keyboard: HeroUI's input is visually hidden, so a pointer click on it is refused. */
const toggle = async (page: Page, scope: Locator, name: string) => {
  await scope.getByRole("checkbox", { name }).focus();
  await page.keyboard.press("Space");
};

test("the live count is one polite status that is in the page before it speaks", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "bulk-action-bar-live");
  const status = live.locator('div[role="status"].sr-only');
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("2 selected");
  await toggle(page, live, "Order #1005");
  await expect(status).toHaveText("3 selected");
  await toggle(page, live, "Order #1002");
  await toggle(page, live, "Order #1003");
  await toggle(page, live, "Order #1005");
  // With nothing selected the toolbar goes and the status stays, empty, ready for the next count.
  await expect(live.getByRole("toolbar")).toHaveCount(0);
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("");
  // The next count is a change of text in the same element, which is what a screen reader announces.
  await toggle(page, live, "Order #1001");
  await expect(status).toHaveText("1 selected");
});

test("the arrow keys move between the toolbar's buttons", async ({ page }) => {
  await open(page, "light", "en");
  const toolbar = sectionOf(page, "bulk-action-bar-live").getByRole("toolbar");
  const buttons = toolbar.getByRole("button");
  await buttons.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(buttons.first()).toBeFocused();
});

test("a slow action shows itself busy and then clears the selection", async ({ page }) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "bulk-action-bar-live");
  const toolbar = live.getByRole("toolbar");
  const archive = toolbar.getByRole("button", { name: "Archive" });
  await archive.click();
  await expect(archive).toHaveAttribute("data-pending", "true");
  await expect(live.getByTestId("bulk-action-bar-last")).toHaveText("Last action: Archive running");
  await expect(live.getByTestId("bulk-action-bar-selected")).toHaveText("Selected: none");
  await expect(live.getByTestId("bulk-action-bar-last")).toHaveText("Last action: Archive done");
  await expect(toolbar).toHaveCount(0);
});

test("a failing action leaves the selection as it was and no error reaches the browser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "light", "en");
  const live = sectionOf(page, "bulk-action-bar-live");
  await live.getByRole("toolbar").getByRole("button", { name: "Delete" }).click();
  await expect(live.getByTestId("bulk-action-bar-last")).toHaveText("Last action: Delete failed");
  await expect(live.getByTestId("bulk-action-bar-selected")).toHaveText(
    "Selected: ord-1002, ord-1003",
  );
  await expect(live.getByRole("toolbar")).toBeVisible();
  // The button is usable again once the promise has settled.
  await expect(live.getByRole("button", { name: "Delete" })).not.toHaveAttribute(
    "data-pending",
    "true",
  );
  expect(errors).toEqual([]);
});

test("a refused action says why in its name and is not run", async ({ page }) => {
  await open(page, "light", "en");
  const actions = sectionOf(page, "bulk-action-bar-actions");
  const refund = actions.getByRole("button", { name: "Refund: Paid orders stay" });
  await expect(refund).toBeDisabled();
  await expect(refund).toContainText("Refund");
});

test("select all matching is offered for a fully selected page and turns into select only the rows shown", async ({
  page,
}) => {
  await open(page, "light", "en");
  const matching = sectionOf(page, "bulk-action-bar-matching");
  const offered = matching.getByRole("toolbar", { name: "Actions, Select all matching" });
  await expect(offered).toContainText("20 selected");
  const choice = offered.getByRole("button", { name: "Select all 245" });
  await choice.focus();
  await page.keyboard.press("Enter");
  await expect(offered).toContainText("245 selected");
  // The same button stays under focus and now goes back to the rows shown.
  const back = offered.getByRole("button", { name: "Select only the 20 shown" });
  await expect(back).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(offered).toContainText("20 selected");
  await expect(offered.getByRole("button", { name: "Select all 245" })).toBeVisible();
});

test("an emptied selection moves focus to the example instead of dropping it", async ({ page }) => {
  await open(page, "light", "en");
  const live = sectionOf(page, "bulk-action-bar-live");
  await live.getByRole("button", { name: "Clear selection" }).focus();
  await page.keyboard.press("Enter");
  await expect(live.getByRole("toolbar")).toHaveCount(0);
  await expect(live.getByTestId("bulk-action-bar-live")).toBeFocused();
});

test("every button is at least 24 px square", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = await page.locator('[role="toolbar"] button, [role="toolbar"] a').all();
  expect(buttons.length).toBeGreaterThan(5);
  for (const button of buttons) {
    const box = await button.boundingBox();
    if (!box) throw new Error("no box for a button");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

for (const locale of LOCALES)
  test(`the count sits at the reading-start side of the bar in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const toolbar = sectionOf(page, "bulk-action-bar-counts").getByRole("toolbar", {
      name: "Actions, Three selected",
    });
    const count = await toolbar.locator("p").first().boundingBox();
    const clear = await toolbar.getByRole("button").last().boundingBox();
    if (!count || !clear) throw new Error("a box is missing");
    expect(count.x < clear.x, locale).toBe(locale === "en");
  });
