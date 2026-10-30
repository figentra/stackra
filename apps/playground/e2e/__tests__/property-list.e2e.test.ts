/**
 * Stackra file contract:
 * Purpose: the property-list route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, also after a copy and with two columns; each sample is a description list
 *          of terms and definitions in order; an empty value shows a dash or the given words and zero shows as a value;
 *          a copy button is named by its row's copy label, reachable in tab order, at least 24 px square, and copies the
 *          value (or the copy value) with Enter, shows a check for two seconds and says "Copied" in a live region; the
 *          switch moves the list between one and two columns, and the labels sit at the reading-start side in both
 *          directions.
 * Boundary: the production build under `vite preview`; Chromium only, with the clipboard permissions granted.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0182 (test
 *          tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-134 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/property-list?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Property list", locale) }),
  ).toBeVisible();
};

/** Turns the columns switch on from the keyboard: HeroUI's hidden input is overlapped by its drawn control, so a pointer click on the input is refused. */
const showTwoColumns = async (page: Page) => {
  // The live example's one switch, unnamed here: its name is in the page's language.
  await example(page, "live").getByRole("switch").focus();
  await page.keyboard.press("Space");
};

const axe = async (page: Page) => {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
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
  for (const locale of LOCALES)
    test(`axe finds nothing on the property list page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await axe(page);
    });

for (const scheme of SCHEMES)
  test(`axe finds nothing after a copy and with two columns, in ${scheme}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, scheme, "en");
    await showTwoColumns(page);
    const live = example(page, "live");
    await live.getByRole("button", { name: "Copy email" }).focus();
    await page.keyboard.press("Enter");
    await expect(live.getByTestId("last-copied")).toContainText("ada@example.com");
    await axe(page);
  });

test("each sample is a description list of terms and definitions, in order", async ({ page }) => {
  await open(page, "light", "en");
  const columns = example(page, "usage");
  await expect(columns.locator("dl")).toHaveCount(2);
  const list = columns.locator("dl").first();
  await expect(list.locator("dt")).toHaveText(["Customer", "Email", "Order id", "Items"]);
  await expect(list.locator("dd")).toHaveText([
    "Ada Lovelace",
    "ada@example.com",
    "ord_01H2J3K4L5M6N7P8Q9R0",
    "3",
  ]);
});

test("an empty value shows a dash or the given words, and zero is a value", async ({ page }) => {
  await open(page, "light", "en");
  const values = example(page, "values");
  const row = (label: string) =>
    values.locator('[data-slot="property-list-row"]', { hasText: label });
  await expect(row("Note").first().locator("dd")).toHaveText("–");
  await expect(row("Open refunds").locator("dd")).toHaveText("0");
  await expect(row("Phone").locator("dd")).toHaveText("Not set");
  await expect(row("Status").locator("dd")).toContainText("Paid");
});

test("a copy button is named by its row, in tab order, and at least 24 px square", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");
  // Icon-only: named by their row, with no visible text ("Show code" is the pane's own button).
  await expect(live.getByRole("button", { name: /^Copy / })).toHaveText(["", "", ""]);
  await live.getByRole("switch", { name: "Show two columns" }).focus();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("button", { name: "Copy email" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("button", { name: "Copy order id" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(live.getByRole("button", { name: "Copy total" })).toBeFocused();
  for (const name of ["Copy email", "Copy order id", "Copy total"]) {
    const box = await live.getByRole("button", { name }).boundingBox();
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(24);
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(24);
  }
});

test("Enter on a copy button copies the value, shows a check for two seconds and says Copied", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "light", "en");
  const live = example(page, "live");
  const button = live.getByRole("button", { name: "Copy order id" });
  await expect(button.locator("svg.lucide-copy")).toHaveCount(1);
  await button.focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "ord_01H2J3K4L5M6N7P8Q9R0",
  );
  await expect(live.getByTestId("last-copied")).toContainText("ord_01H2J3K4L5M6N7P8Q9R0");
  await expect(button.locator("svg.lucide-check")).toHaveCount(1);
  await expect(live.getByRole("status")).toHaveText("Copied");
  await expect(button).toBeFocused();
  await expect(button.locator("svg.lucide-copy")).toHaveCount(1, { timeout: 5000 });
  await expect(live.getByRole("status")).toHaveText("");
});

test("a row with a copy value copies it, not the shown value", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "light", "en");
  const live = example(page, "live");
  await expect(live.locator('[data-slot="property-list-row"]', { hasText: "Total" })).toContainText(
    "EUR 128.00",
  );
  await live.getByRole("button", { name: "Copy total" }).focus();
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("128.00");
});

test("the switch moves the list between one and two columns", async ({ page }) => {
  await open(page, "light", "en");
  const rows = example(page, "live").locator('[data-slot="property-list-row"]');
  const firstX = async () => (await rows.nth(0).boundingBox())?.x ?? NaN;
  const secondX = async () => (await rows.nth(1).boundingBox())?.x ?? NaN;
  expect(await secondX()).toBeCloseTo(await firstX(), 0);
  await showTwoColumns(page);
  expect(await secondX()).toBeGreaterThan(await firstX());
});

test("two columns run in the reading direction, starting at the reading-start side", async ({
  page,
}) => {
  await open(page, "light", "ar");
  await showTwoColumns(page);
  const rows = example(page, "live").locator('[data-slot="property-list-row"]');
  const first = await rows.nth(0).boundingBox();
  const second = await rows.nth(1).boundingBox();
  if (!first || !second) throw new Error("a box is missing");
  expect(second.x).toBeLessThan(first.x);
});

for (const locale of LOCALES)
  test(`the labels sit at the reading-start side of the list in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const list = example(page, "usage").locator("dl").first();
    const term = list.locator("dt").first();
    const listBox = await list.boundingBox();
    const termBox = await term.locator("span").boundingBox();
    if (!listBox || !termBox) throw new Error("a box is missing");
    if (locale === "en") expect(termBox.x).toBeCloseTo(listBox.x, 0);
    else expect(termBox.x + termBox.width).toBeCloseTo(listBox.x + listBox.width, 0);
  });
