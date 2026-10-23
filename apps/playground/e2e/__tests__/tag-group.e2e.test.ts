/**
 * Stackra file contract:
 * Purpose: the tag group route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each group is named by its label or its aria-label and the description is
 *          tied to it; the live tags move with the arrow keys, are selected with Space and removed with Delete, and a
 *          remove button is named for its tag; a disabled tag is refused and a read-only group has no buttons; sizes
 *          grow from small to large; and the first tag sits at the reading-start side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
// @covers sta-350:FR-080 sta-350:FR-081 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/tag-group?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tag group" })).toBeVisible();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the tag group page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each group is named, and the description and the error are tied to it", async ({ page }) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Basics" });
  await expect(basics.getByRole("grid", { name: "Topics" })).toBeVisible();
  await expect(basics.getByRole("grid", { name: "Post tags" })).toBeVisible();
  await expect(basics.getByRole("grid", { name: "Amenities" })).toHaveAccessibleDescription(
    "Shown on the listing page.",
  );

  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("grid", { name: "Invalid" })).toHaveAccessibleDescription(
    "Choose at least one topic.",
  );
});

test("the live tags move with the arrow keys, select with Space and remove with Delete", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("tag-group-selected")).toHaveText("Selected: open");

  await live.getByRole("row", { name: "Open" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(live.getByRole("row", { name: "Assigned to me" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(live.getByTestId("tag-group-selected")).toHaveText("Selected: open, mine");

  // Delete on a selected tag removes every selected tag, so the second Space clears this one first.
  await page.keyboard.press("Space");
  await expect(live.getByTestId("tag-group-selected")).toHaveText("Selected: open");
  await page.keyboard.press("Delete");
  await expect(live.getByRole("row", { name: "Assigned to me" })).toHaveCount(0);
  await expect(live.getByTestId("tag-group-removed")).toHaveText("Removed: mine");
  await expect(live.getByTestId("tag-group-selected")).toHaveText("Selected: open");
});

test("a remove button is named for its tag, removes it, and the tags come back on restore", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await live.getByRole("button", { name: "Remove Urgent" }).click();
  await expect(live.getByRole("row", { name: "Urgent" })).toHaveCount(0);
  await expect(live.getByTestId("tag-group-removed")).toHaveText("Removed: urgent");

  await live.getByRole("button", { name: "Restore the tags" }).click();
  await expect(live.getByRole("row", { name: "Urgent" })).toBeVisible();
  await expect(live.getByTestId("tag-group-removed")).toHaveText("Removed: none");
});

test("a pressed tag toggles its selection in multiple mode and replaces it in single mode", async ({
  page,
}) => {
  await open(page, "light", "en");
  const selection = page.getByRole("region", { name: "Selection" });
  const single = selection.getByRole("grid", { name: "One selected" });
  await single.getByRole("row", { name: "News" }).click();
  await expect(single.getByRole("row", { name: "News" })).toHaveAttribute("aria-selected", "true");
  await expect(single.getByRole("row", { name: "Travel" })).toHaveAttribute(
    "aria-selected",
    "false",
  );

  const several = selection.getByRole("grid", { name: "Several selected" });
  await several.getByRole("row", { name: "Travel" }).click();
  await expect(several.locator('[aria-selected="true"]')).toHaveCount(3);
  await several.getByRole("row", { name: "News" }).click();
  await expect(several.locator('[aria-selected="true"]')).toHaveCount(2);

  const plain = selection.getByRole("grid", { name: "No selection" });
  await plain.getByRole("row", { name: "News" }).click();
  await expect(plain.locator('[aria-selected="true"]')).toHaveCount(0);
});

test("a disabled tag is refused, a disabled group refuses every tag, and read-only has no buttons", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  const refused = states.getByRole("grid", { name: "One disabled tag" });
  await expect(refused.getByRole("row", { name: "Travel" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await refused.getByRole("row", { name: "Travel" }).click({ force: true });
  await expect(refused.locator('[aria-selected="true"]')).toHaveCount(0);

  const disabled = states.getByRole("grid", { name: "Disabled group" });
  await expect(disabled.locator('[aria-disabled="true"]')).toHaveCount(4);

  await expect(states.getByRole("grid", { name: "Read-only" }).getByRole("button")).toHaveCount(0);
  await expect(states.getByText("No filters applied.")).toBeVisible();
});

test("tags grow from small to large", async ({ page }) => {
  await open(page, "light", "en");
  const sizes = page.getByRole("region", { name: "Sizes and surfaces" });
  const heights: number[] = [];
  for (const size of ["sm", "md", "lg"]) {
    const tag = sizes
      .getByRole("grid", { name: `Size ${size}, default` })
      .locator('[data-slot="tag"]')
      .first();
    const box = await tag.boundingBox();
    if (!box) throw new Error(`no box for size ${size}`);
    heights.push(box.height);
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

for (const locale of LOCALES)
  test(`the first tag sits at the reading-start side in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const tags = page
      .getByRole("region", { name: "Basics" })
      .getByRole("grid", { name: "Topics" })
      .locator('[data-slot="tag"]');
    const first = await tags.nth(0).boundingBox();
    const second = await tags.nth(1).boundingBox();
    if (!first || !second) throw new Error("a box is missing");
    expect(first.x < second.x, locale).toBe(locale === "en");
  });
