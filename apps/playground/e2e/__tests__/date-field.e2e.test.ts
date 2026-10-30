/**
 * Stackra file contract:
 * Purpose: the date-field route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each field's group is named by its label and described by its description and
 *          every segment is named and at least 24 pixels square; a day is typed into the live field and the arrow keys
 *          step a segment; the left and right arrow keys move between segments by where they are drawn, in both directions;
 *          the bounded field turns invalid when stepped out of its month and the invalid field is read with its error; a
 *          disabled field leaves the tab order and a read-only one keeps focus but refuses every change; the focus shows a
 *          ring on the group and a highlight on the segment; and the label sits at the reading-start side and the segments
 *          run in the reading direction.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-208 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/date-field?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Date field", locale) }),
  ).toBeVisible();
};

/** The demos' labels in Arabic: the page translates its demos, so an Arabic page is searched by these. */
const ARABIC: Record<string, string> = {
  "Start date": "تاريخ البدء",
  "Due date": "تاريخ الاستحقاق",
  "Check-in date": "تاريخ الوصول",
};

/** A label in the page's language. */
const inLocale = (page: Page, label: string) =>
  new URL(page.url()).searchParams.get("locale") === "ar" ? (ARABIC[label] ?? label) : label;

/** The whole field (label, group and messages) whose label contains this text. */
const fieldOf = (page: Page, label: string) =>
  // Not the hidden, inert copies the Stackra section draws of the usage demo.
  page.locator('[data-slot="date-field"]:not([aria-hidden="true"] *)', {
    hasText: inLocale(page, label),
  });

/** The editable segments (month, day and year) of the field whose label contains this text, in the order drawn. */
const segmentsOf = (page: Page, label: string) =>
  fieldOf(page, label).locator('[data-slot="date-input-group-segment"][role="spinbutton"]');

/** The segment of a kind: "month", "day" or "year". */
const segmentOf = (page: Page, label: string, kind: string) =>
  fieldOf(page, label).locator(`[role="spinbutton"][data-type="${kind}"]`);

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the date field page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each group is named by its label and described by its description", async ({ page }) => {
  await open(page, "light", "en");
  const due = fieldOf(page, "Due date").getByRole("group", { name: "Due date" }).first();
  await expect(due).toBeVisible();
  // A regex: React Aria also puts the chosen day, "Selected Date: ...", into the description of a filled field.
  await expect(due).toHaveAccessibleDescription(/The day the invoice is due\./);
  await expect(
    fieldOf(page, "Start date").getByRole("group", { name: "Start date" }).first(),
  ).toHaveAccessibleDescription(/Type the month, the day and the year\./);
});

test("each segment is named with the field's label and is at least 24 pixels square", async ({
  page,
}) => {
  await open(page, "light", "en");
  const due = fieldOf(page, "Due date");
  for (const kind of ["month", "day", "year"])
    await expect(
      due.getByRole("spinbutton", { name: new RegExp(`${kind}.*Due date`) }),
    ).toBeVisible();
  for (const label of ["Start date", "Due date", "Booking date"]) {
    const segments = segmentsOf(page, label);
    await expect(segments).toHaveCount(3);
    for (const segment of await segments.all()) {
      const box = await boxOf(segment);
      expect(box.width, `${label} segment width`).toBeGreaterThanOrEqual(24);
      expect(box.height, `${label} segment height`).toBeGreaterThanOrEqual(24);
    }
  }
});

test("an empty field shows a placeholder and a filled one its day", async ({ page }) => {
  await open(page, "light", "en");
  await expect(segmentsOf(page, "Start date")).toHaveText(["mm", "dd", "yyyy"]);
  await expect(segmentsOf(page, "Due date")).toHaveText(["3", "5", "2026"]);
});

test("a day typed into the live field is reported", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const echo = live.getByTestId("date-field-value");
  await expect(echo).toHaveText("No day chosen yet.");
  await segmentOf(page, "Check-in date", "month").focus();
  await page.keyboard.type("03052026");
  await expect(echo).toHaveText("Chosen day: 2026-03-05");
  await expect(segmentsOf(page, "Check-in date")).toHaveText(["3", "5", "2026"]);
});

test("the up and down arrow keys step the segment that has focus", async ({ page }) => {
  await open(page, "light", "en");
  const day = segmentOf(page, "Due date", "day");
  await day.focus();
  await page.keyboard.press("ArrowUp");
  await expect(day).toHaveText("6");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(day).toHaveText("4");
  await expect(segmentOf(page, "Due date", "month")).toHaveText("3");
});

for (const locale of LOCALES)
  test(`the arrow keys move between segments by where they are drawn in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const segments = segmentsOf(page, "Due date");
    await segments.nth(0).focus();
    await page.keyboard.press(locale === "en" ? "ArrowRight" : "ArrowLeft");
    await expect(segments.nth(1)).toBeFocused();
    await page.keyboard.press(locale === "en" ? "ArrowLeft" : "ArrowRight");
    await expect(segments.nth(0)).toBeFocused();
  });

test("the bounded field turns invalid when stepped out of its month and shows its error", async ({
  page,
}) => {
  await open(page, "light", "en");
  const field = fieldOf(page, "Booking date");
  const month = segmentOf(page, "Booking date", "month");
  await expect(month).not.toHaveAttribute("aria-invalid", "true");
  await expect(field.getByText("Pick a day in March 2026.")).toBeHidden();
  await month.focus();
  await page.keyboard.press("ArrowUp");
  await expect(month).toHaveText("4");
  await expect(month).toHaveAttribute("aria-invalid", "true");
  await expect(field.getByText("Pick a day in March 2026.")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(month).not.toHaveAttribute("aria-invalid", "true");
});

test("a weekend day in the invalid field is marked invalid and read with its error", async ({
  page,
}) => {
  await open(page, "light", "en");
  const field = fieldOf(page, "Delivery date");
  await expect(segmentOf(page, "Delivery date", "day")).toHaveAttribute("aria-invalid", "true");
  await expect(field.getByText("We do not deliver at weekends.")).toBeVisible();
  await expect(
    field.getByRole("group", { name: "Delivery date" }).first(),
  ).toHaveAccessibleDescription(/We do not deliver at weekends\./);
});

test("a disabled field leaves the tab order and a read-only one keeps focus but refuses change", async ({
  page,
}) => {
  await open(page, "light", "en");
  for (const segment of await segmentsOf(page, "Cancelled on").all()) {
    await expect(segment).toHaveAttribute("aria-disabled", "true");
    await expect(segment).not.toHaveAttribute("tabindex");
  }
  const day = segmentOf(page, "Signed on", "day");
  await expect(day).toHaveAttribute("aria-readonly", "true");
  await day.focus();
  await expect(day).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Backspace");
  await expect(segmentsOf(page, "Signed on")).toHaveText(["2", "12", "2026"]);
  await expect(segmentsOf(page, "Cancelled on")).toHaveText(["1", "20", "2026"]);
});

test("the focused field shows a ring on its group and a highlight on its segment", async ({
  page,
}) => {
  await open(page, "light", "en");
  const day = segmentOf(page, "Due date", "day");
  await day.focus();
  const group = fieldOf(page, "Due date").locator('[data-slot="date-input-group"]');
  const ring = await group.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      style.boxShadow !== "none" ||
      (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0)
    );
  });
  expect(ring).toBe(true);
  const highlighted = await day.evaluate(
    (element) => getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)",
  );
  expect(highlighted).toBe(true);
});

for (const locale of LOCALES) {
  test(`the label sits at the reading-start side of the field in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const field = fieldOf(page, "Due date");
    const label = await boxOf(field.locator('[data-slot="label"]'));
    const group = await boxOf(field.locator('[data-slot="date-input-group"]'));
    if (locale === "en") expect(label.x).toBeCloseTo(group.x, 0);
    else expect(label.x + label.width).toBeCloseTo(group.x + group.width, 0);
  });

  test(`the segments run in the reading direction in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const segments = segmentsOf(page, "Due date");
    const first = await boxOf(segments.first());
    const last = await boxOf(segments.last());
    // Left to right in English, right to left in Arabic.
    expect(last.x > first.x, locale).toBe(locale === "en");
  });
}
