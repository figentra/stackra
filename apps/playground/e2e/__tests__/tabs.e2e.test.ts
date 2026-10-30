/**
 * Stackra file contract:
 * Purpose: the tabs route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a tab list is named by its label and each panel by its tab; a press selects a
 *          tab and shows only its panel; the arrow keys move and select (reversed in right-to-left, vertical tabs on the
 *          up and down keys), Home and End jump to the ends and a disabled tab is skipped and refused; a disabled list
 *          refuses every tab; the empty and loading states say so; the controlled list follows the page's buttons; every
 *          tab is a touch target of at least 24 pixels; and the first tab sits at the reading-start side in both
 *          directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-139 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

/** An example's Preview pane: the page wraps each demo in its own Preview, Code and Install tabs, which are not the demo's. */
const PREVIEW = '[id$="-tabpanel-preview"]';

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/tabs?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Tabs", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the tabs page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("a tab list is named by its label and each panel by its tab", async ({ page }) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
  const list = basics.getByRole("tablist", { name: "Order sections" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("tab", { name: "Overview" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(basics.getByRole("tabpanel", { name: "Overview" }).first()).toBeVisible();
});

test("a press selects a tab and shows only its panel", async ({ page }) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
  const list = basics.getByRole("tablist", { name: "Order sections" });
  await list.getByRole("tab", { name: "Items" }).click();
  await expect(list.getByRole("tab", { name: "Items" })).toHaveAttribute("aria-selected", "true");
  await expect(list.getByRole("tab", { name: "Overview" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  // Only the selected tab's panel is in the page: the list's own root holds exactly one.
  const root = basics.locator(PREVIEW).locator('[data-slot="tabs"]').first();
  await expect(root.getByRole("tabpanel")).toHaveCount(1);
  await expect(root.getByRole("tabpanel", { name: "Items" })).toBeVisible();
});

test("the arrow keys move and select, Home and End jump to the ends", async ({ page }) => {
  await open(page, "light", "en");
  // By id and place: the words speak the page's locale.
  const list = example(page, "variants").locator(PREVIEW).getByRole("tablist").first();
  const tab = (name: string) => list.getByRole("tab", { name });
  await tab("Overview").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab("Items")).toBeFocused();
  await expect(tab("Items")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(tab("History")).toBeFocused();
  await expect(tab("History")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
  // Past the last tab it wraps round to the first.
  await page.keyboard.press("ArrowLeft");
  await expect(tab("History")).toHaveAttribute("aria-selected", "true");
});

test("the arrow keys are reversed in right-to-left", async ({ page }) => {
  await open(page, "light", "ar");
  // By id and place: the words speak the page's locale.
  const list = example(page, "variants").locator(PREVIEW).getByRole("tablist").first();
  const tabs = list.getByRole("tab");
  await tabs.nth(0).focus();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
});

test("vertical tabs run on the up and down keys", async ({ page }) => {
  await open(page, "light", "en");
  const list = page
    .getByRole("region", { name: "Orientation" })
    .getByRole("tablist", { name: "Vertical tabs" });
  await expect(list).toHaveAttribute("aria-orientation", "vertical");
  const tabs = list.getByRole("tab");
  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const first = await tabs.nth(0).boundingBox();
  const second = await tabs.nth(1).boundingBox();
  if (!first || !second) throw new Error("a box is missing");
  expect(first.y).toBeLessThan(second.y);
});

test("a disabled tab is skipped by the keys and refused by a press", async ({ page }) => {
  await open(page, "light", "en");
  const list = page
    .getByRole("region", { name: "States" })
    .getByRole("tablist", { name: "One disabled tab" });
  const tab = (name: string) => list.getByRole("tab", { name });
  await expect(tab("Items")).toHaveAttribute("aria-disabled", "true");
  await tab("Items").click({ force: true });
  await expect(tab("Overview")).toHaveAttribute("aria-selected", "true");
  await tab("Overview").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab("History")).toBeFocused();
  await expect(tab("History")).toHaveAttribute("aria-selected", "true");
  await expect(tab("Items")).toHaveAttribute("aria-selected", "false");
});

test("a disabled list refuses every tab from the pointer and the keyboard", async ({ page }) => {
  await open(page, "light", "en");
  const list = page
    .getByRole("region", { name: "States" })
    .getByRole("tablist", { name: "Disabled tabs" });
  const tabs = list.getByRole("tab");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  for (const index of [0, 1, 2])
    await expect(tabs.nth(index)).toHaveAttribute("aria-disabled", "true");
  await tabs.nth(2).click({ force: true });
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "false");
  // A disabled tab cannot take focus, so the key goes nowhere.
  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
});

test("the empty and loading states say so", async ({ page }) => {
  await open(page, "light", "en");
  const empty = page.getByRole("region", { name: "Empty and loading" });
  await expect(empty.getByText("No sections yet.")).toBeVisible();
  await expect(empty.getByLabel("Loading sections")).toBeVisible();
  await expect(empty.locator(PREVIEW).getByRole("tablist")).toHaveCount(0);
});

test("the controlled list follows the page's buttons and the page follows the list", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("tabs-selected")).toHaveText("Selected: overview");
  await live.getByRole("tab", { name: "Items" }).click();
  await expect(live.getByTestId("tabs-selected")).toHaveText("Selected: items");
  await live.getByRole("button", { name: "Show history" }).click();
  await expect(live.getByTestId("tabs-selected")).toHaveText("Selected: history");
  await expect(live.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
  await expect(live.getByRole("tabpanel", { name: "History" })).toBeVisible();
});

test("every tab is a touch target of at least 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const tabs = page.getByRole("region", { name: "Usage" }).getByRole("tab");
  for (let index = 0; index < (await tabs.count()); index += 1) {
    const box = await tabs.nth(index).boundingBox();
    if (!box) throw new Error(`no box for tab ${index}`);
    expect(box.height, `tab ${index} height`).toBeGreaterThanOrEqual(24);
    expect(box.width, `tab ${index} width`).toBeGreaterThanOrEqual(24);
  }
});

for (const locale of LOCALES)
  test(`the first tab sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By id and place: the words speak the page's locale.
    const tabs = example(page, "variants")
      .locator(PREVIEW)
      .getByRole("tablist")
      .first()
      .getByRole("tab");
    const first = await tabs.nth(0).boundingBox();
    const second = await tabs.nth(1).boundingBox();
    if (!first || !second) throw new Error("a box is missing");
    expect(first.x < second.x, locale).toBe(locale === "en");
  });
