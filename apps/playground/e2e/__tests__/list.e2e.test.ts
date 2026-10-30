/**
 * Stackra file contract:
 * Purpose: the list route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; a plain list is a named list with no widget role and a selecting one a
 *          named list box; a pressable row is reached with Tab and pressed with Enter and Space and keeps its focus; a
 *          disabled row is refused; options move with the arrow keys, select with Space and report the ids in the rows'
 *          order; scrolling the box to its end loads more rows; every pressable row is at least 24 pixels tall; and the
 *          chevron sits at the reading-end side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-130 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/list?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("List", locale) }),
  ).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the list page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("a plain list is a named list of items, and a selecting one a named list box", async ({
  page,
}) => {
  await open(page, "light", "en");
  // The demo itself, not its preview pane's toggles and code button.
  const basics = page.getByRole("region", { name: "Usage" }).locator('[data-slot="surface"]');
  const list = basics.getByRole("list", { name: "Recent orders" });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(basics.getByRole("listbox")).toHaveCount(0);
  await expect(basics.getByRole("button")).toHaveCount(0);

  const selection = page.getByRole("region", { name: "Selection" });
  await expect(selection.getByRole("listbox", { name: "One selected" })).toBeVisible();
  await expect(selection.getByRole("listbox", { name: "Several selected" })).toBeVisible();
});

test("a pressable row is reached with Tab, pressed with Enter and Space, and keeps its focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try pressing" });
  const status = live.getByTestId("list-pressed");
  await expect(status).toHaveText("Pressed: none");

  const first = live.getByRole("button", { name: /Order 1042/ });
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Pressed: Order 1042");
  await expect(first).toBeFocused();

  await page.keyboard.press("Tab");
  const second = live.getByRole("button", { name: /Order 1043/ });
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Pressed: Order 1043");
  await expect(second).toBeFocused();
});

test("a disabled row is refused and a pressable row is at least 24 pixels tall", async ({
  page,
}) => {
  await open(page, "light", "en");
  const press = page.getByRole("region", { name: "Pressable rows" });
  const disabled = press.getByRole("button", { name: /Profile, disabled/ });
  await expect(disabled).toBeDisabled();
  await disabled.click({ force: true });
  await expect(disabled).not.toBeFocused();

  for (const row of await press.getByRole("button").all()) {
    const box = await row.boundingBox();
    if (!box) throw new Error("a row has no box");
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("options move with the arrow keys, select with Space and report the ids in the rows' order", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try selecting" });
  const status = live.getByTestId("list-selected");
  await expect(status).toHaveText("Selected: email");

  await live.getByRole("option", { name: /Email/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(live.getByRole("option", { name: /Push/ })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Selected: email, push");

  // The disabled row is skipped by the arrow keys, so the next option is Chat.
  await page.keyboard.press("ArrowDown");
  await expect(live.getByRole("option", { name: /Chat/ })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Selected: email, push, chat");
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Selected: email, push");
});

test("one selected clears when pressed again and a refused option stays unselected", async ({
  page,
}) => {
  await open(page, "light", "en");
  const single = page
    .getByRole("region", { name: "Selection" })
    .getByRole("listbox", { name: "One selected" });
  await expect(single.getByRole("option", { name: /Push/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await single.getByRole("option", { name: /Email/ }).click();
  await expect(single.getByRole("option", { name: /Email/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(single.getByRole("option", { name: /Push/ })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await single.getByRole("option", { name: /Email/ }).click();
  await expect(single.locator('[aria-selected="true"]')).toHaveCount(0);

  await single.getByRole("option", { name: /SMS/ }).click({ force: true });
  await expect(single.locator('[aria-selected="true"]')).toHaveCount(0);
});

test("scrolling the box to its end loads five more rows, up to fifteen, naming one spinner", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try loading more" });
  const box = live.getByTestId("list-scroll");
  const count = live.getByTestId("list-count");
  await expect(count).toHaveText("5 rows");
  // The end marker is watched against the window, so the box must be on screen, as it is when a reader scrolls it.
  await box.scrollIntoViewIfNeeded();

  for (const next of [10, 15]) {
    await box.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(count).toHaveText(`${next} rows`);
  }
  await expect(box.getByRole("listitem")).toHaveCount(15);
  await expect(box.getByRole("status")).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the chevron sits at the reading-end side of the title in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    // By place: the row's words speak the page's locale; Profile is the first pressable row.
    const row = example(page, "press").getByRole("listitem").first().getByRole("button");
    const title = await row.locator("span.grid > span").first().boundingBox();
    const chevron = await row.locator("svg").last().boundingBox();
    if (!title || !chevron) throw new Error("a box is missing");
    // English reads left to right, so the end is on the right; Arabic reads the other way.
    expect(title.x < chevron.x, locale).toBe(locale === "en");
  });
