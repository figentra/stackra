/**
 * Stackra file contract:
 * Purpose: the checkbox-group route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left; every group is named by its label and holds named checkboxes; Tab
 *          moves through the boxes and Space toggles each; a disabled option and a disabled or read-only group do not
 *          change; the group's description and message describe the group; and the live readout follows the choices
 *          in the order they were made.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2; ADR 0182 (test tiers); ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-084 sta-350:FR-086 sta-350:FR-087 sta-350:FR-089 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/checkbox-group?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Checkbox group" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the checkbox-group page in ${scheme}, ${locale}`, async ({
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

test("every group is named by its label and holds named checkboxes", async ({ page }) => {
  await open(page, "light", "en");
  const groups = page.locator("article").getByRole("group");
  const count = await groups.count();
  expect(count).toBe(9);
  for (let index = 0; index < count; index += 1) {
    const group = groups.nth(index);
    await expect(group, `group ${index}`).toHaveAccessibleName(/\S/);
    const boxes = group.getByRole("checkbox");
    expect(await boxes.count(), `group ${index}`).toBeGreaterThanOrEqual(2);
    for (let box = 0; box < (await boxes.count()); box += 1)
      await expect(boxes.nth(box), `group ${index}, box ${box}`).toHaveAccessibleName(/\S/);
  }
});

test("Tab moves through the boxes of a group and Space toggles each", async ({ page }) => {
  await open(page, "light", "en");
  const group = page.getByRole("group", { name: "Notify me by" });
  const email = group.getByRole("checkbox", { name: "Email" });
  const sms = group.getByRole("checkbox", { name: "Text message" });
  await email.focus();
  await expect(email).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(sms).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sms).toBeChecked();
  await page.keyboard.press("Space");
  await expect(sms).not.toBeChecked();
});

test("a disabled option, a disabled group and a read-only group do not change", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(
    page.getByRole("group", { name: "Export formats" }).getByRole("checkbox", { name: "PDF" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("group", { name: "Export formats" }).getByRole("checkbox", { name: "CSV" }),
  ).toBeEnabled();
  for (const box of await page
    .getByRole("group", { name: "Weekly reports" })
    .getByRole("checkbox")
    .all())
    await expect(box).toBeDisabled();
  const readOnly = page.getByRole("group", { name: "Included in your plan" });
  const csv = readOnly.getByRole("checkbox", { name: "CSV" });
  await csv.focus();
  await page.keyboard.press("Space");
  await expect(csv).toBeChecked();
  await expect(csv).toBeFocused();
});

test("the invalid group is described by its description and message until a day is chosen", async ({
  page,
}) => {
  await open(page, "light", "en");
  const group = page.getByRole("group", { name: "Delivery days" });
  await expect(group).toHaveAccessibleDescription(
    "Pick at least one day. Choose a delivery day to continue.",
  );
  await group.getByRole("checkbox", { name: "Monday" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Choose a delivery day to continue.")).toBeHidden();
});

for (const locale of LOCALES)
  test(`each box sits on the reading-start side of its label in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // A `has` locator is queried inside the item, so the group scopes the items and the box is found by role alone.
    const item = page
      .getByRole("group", { name: "Notify me by" })
      .locator('[data-slot="checkbox"]')
      .filter({ has: page.getByRole("checkbox", { name: "Text message" }) });
    const control = await item.locator('[data-slot="checkbox-control"]').boundingBox();
    const label = await item.locator('[data-slot="label"]').boundingBox();
    if (!control || !label) throw new Error("a box is missing");
    expect(control.x < label.x, locale).toBe(locale === "en");
  });

test("the readout lists the choices in the order they were made", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByRole("status")).toHaveText("Chosen: cheese");
  await live.getByText("Basil", { exact: true }).click();
  await live.getByText("Olives", { exact: true }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: cheese, basil, olives");
  await live.getByText("Cheese", { exact: true }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: basil, olives");
  await live.getByRole("button", { name: "Choose all" }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: cheese, olives, basil, chilli");
  await live.getByRole("button", { name: "Clear" }).click();
  await expect(live.getByRole("status")).toHaveText("Chosen: none");
});
