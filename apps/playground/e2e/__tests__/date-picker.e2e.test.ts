/**
 * Stackra file contract:
 * Purpose: the date-picker route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page, and in
 *          the open calendar, in light, dark, left-to-right and right-to-left; each calendar button is named, says it opens a
 *          dialog and is at least 24 pixels square; the calendar opens as a named dialog on the month of the value with
 *          focus on the chosen day; a day is chosen by pointer and by keyboard alone, Escape closes without a change, and
 *          focus returns to the button; Alt and the down arrow open the calendar from the field; Tab stays inside the open
 *          calendar; the month buttons move between months and stop at the bounds; weekends in the invalid picker are
 *          unavailable and refuse a press; a disabled or read-only picker cannot open; the live picker opens from outside,
 *          reports its open state and shows the day chosen; the focus shows a ring; and the button, the weekdays and the
 *          month chevrons are mirrored in a right-to-left page.
 * Boundary: the production build under `vite preview`; Chromium only. While the calendar is open React Aria hides the rest of
 *           the page from assistive technology, so the page behind it is found by CSS locators and the calendar by role.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0182 (test tiers);
 *          ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.1.2, 2.5.8, 4.1.2.
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
  await page.goto(`/date-picker?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Date picker", locale) }),
  ).toBeVisible();
};

/** The demos' labels in Arabic: the page translates its demos, so an Arabic page is searched by these. */
const ARABIC: Record<string, string> = {
  "Start date": "تاريخ البدء",
  "Due date": "تاريخ الاستحقاق",
  "Delivery date": "تاريخ التوصيل",
};

/** A label in the page's language. */
const inLocale = (page: Page, label: string) =>
  new URL(page.url()).searchParams.get("locale") === "ar" ? (ARABIC[label] ?? label) : label;

/** The whole picker (label, field, button and messages) whose label contains this text. */
const pickerOf = (page: Page, label: string) =>
  // Not the hidden, inert copies the Stackra section draws of the usage demo.
  page.locator('[data-slot="date-picker"]:not([aria-hidden="true"] *)', {
    hasText: inLocale(page, label),
  });

/** The button that opens the calendar of the picker whose label contains this text; a CSS locator, since it is hidden from role queries while the calendar is open. */
const triggerOf = (page: Page, label: string) =>
  pickerOf(page, label).locator('[data-slot="date-picker-trigger"]');

/** The editable segments of the picker whose label contains this text, in the order drawn. */
const segmentsOf = (page: Page, label: string) =>
  pickerOf(page, label).locator('[role="spinbutton"]');

const segmentOf = (page: Page, label: string, kind: string) =>
  pickerOf(page, label).locator(`[role="spinbutton"][data-type="${kind}"]`);

/** The open calendar's popover. */
const popoverOf = (page: Page) => page.locator('[data-slot="date-picker-popover"]');

/** A day of the open calendar, found by the start of its spoken name, for example `dayOf(page, "Friday, March 6")`. */
const dayOf = (page: Page, name: string) =>
  popoverOf(page).getByRole("button", { name: new RegExp(`^${name}, 2026`) });

/** Waits until the calendar has finished entering, so a box or a colour is read at rest. */
const settled = async (page: Page) => {
  await expect(popoverOf(page)).toBeVisible();
  await expect(page.locator('[data-slot="date-picker-popover"][data-entering="true"]')).toHaveCount(
    0,
  );
};

/** Opens the calendar of the picker whose label contains this text, with a click on its button. */
const openCalendar = async (page: Page, label: string) => {
  await triggerOf(page, label).click();
  await settled(page);
  return popoverOf(page);
};

/**
 * Hides the page behind the overlay while it is scanned, and shows it again. Axe reads the elements under a see-through
 * backdrop as part of the text's background, and a page that differs from one line of text to the next leaves the
 * contrast check "for review"; the overlay's own colours are what is scanned, and the page has its own axe tests.
 */
const setPageHidden = (page: Page, isHidden: boolean) =>
  page.evaluate((hide) => {
    const root = document.getElementById("root");
    if (root) root.style.visibility = hide ? "hidden" : "";
  }, isHidden);

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

/** The rotation of the chevron inside a month button: "none" as drawn, "180deg" when flipped. */
const arrow = (button: Locator) =>
  button.locator("svg").evaluate((icon) => getComputedStyle(icon).rotate);

const hasRing = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      style.boxShadow !== "none" ||
      (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0)
    );
  });

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the date picker page in ${scheme}, ${locale}`, async ({ page }) => {
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

    for (const label of ["Due date", "Delivery date"])
      test(`axe finds nothing in the open calendar of ${label} in ${scheme}, ${locale}`, async ({
        page,
      }) => {
        await open(page, scheme, locale);
        await openCalendar(page, label);
        await setPageHidden(page, true);
        // Scoped to the dialog, which sits in a portal outside the page's landmarks. The heading rule is switched off:
        // the calendar's one heading is judged against the page's headings, which are not in the scanned part.
        const { violations, incomplete } = await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(AXE_TAGS)
          .disableRules(["heading-order"])
          .analyze();
        expect(
          violations.map((finding) => finding.id),
          "axe violations",
        ).toEqual([]);
        expect(
          incomplete.map((finding) => finding.id),
          "axe checks left for review",
        ).toEqual([]);
        await setPageHidden(page, false);
      });
  }

test("the button is named for the day it chooses, says it opens a dialog and is at least 24 pixels square", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page.getByRole("button", { name: /Choose the due date/ });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  for (const label of [
    "Start date",
    "Due date",
    "Booking date",
    "Delivery date",
    "Check-in date",
  ]) {
    const box = await boxOf(triggerOf(page, label));
    expect(box.width, `${label} button width`).toBeGreaterThanOrEqual(24);
    expect(box.height, `${label} button height`).toBeGreaterThanOrEqual(24);
  }
  for (const segment of await segmentsOf(page, "Due date").all()) {
    const box = await boxOf(segment);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the calendar opens as a dialog named by the button, on the month of the value, with focus on the chosen day", async ({
  page,
}) => {
  await open(page, "light", "en");
  const popover = await openCalendar(page, "Due date");
  await expect(popover).toHaveAttribute("role", "dialog");
  await expect(popover).toHaveAccessibleName("Choose the due date");
  await expect(popover.getByRole("grid", { name: "March 2026" })).toBeVisible();
  await expect(popover.locator('[data-slot="calendar-heading"]')).toHaveText("March 2026");
  await expect(triggerOf(page, "Due date")).toHaveAttribute("aria-expanded", "true");
  await expect(dayOf(page, "Thursday, March 5")).toBeFocused();
});

test("a day is chosen by pointer, shown in the field, and closes the calendar", async ({
  page,
}) => {
  await open(page, "light", "en");
  await openCalendar(page, "Due date");
  await dayOf(page, "Friday, March 6").click();
  await expect(popoverOf(page)).toBeHidden();
  await expect(segmentsOf(page, "Due date")).toHaveText(["3", "6", "2026"]);
});

test("a day is chosen from the keyboard alone, and focus returns to the button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = triggerOf(page, "Due date");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await settled(page);
  await expect(dayOf(page, "Thursday, March 5")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(dayOf(page, "Friday, March 13")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popoverOf(page)).toBeHidden();
  await expect(segmentsOf(page, "Due date")).toHaveText(["3", "13", "2026"]);
  await expect(trigger).toBeFocused();
});

test("Escape closes the calendar without a change and focus returns to the button", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = triggerOf(page, "Due date");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await settled(page);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(popoverOf(page)).toBeHidden();
  await expect(segmentsOf(page, "Due date")).toHaveText(["3", "5", "2026"]);
  await expect(trigger).toBeFocused();
});

test("Alt and the down arrow open the calendar from a segment of the field", async ({ page }) => {
  await open(page, "light", "en");
  await segmentOf(page, "Due date", "day").focus();
  await page.keyboard.press("Alt+ArrowDown");
  await settled(page);
  await expect(popoverOf(page).getByRole("grid", { name: "March 2026" })).toBeVisible();
});

test("Tab stays inside the open calendar", async ({ page }) => {
  await open(page, "light", "en");
  const popover = await openCalendar(page, "Due date");
  for (let press = 0; press < 8; press++) {
    await page.keyboard.press("Tab");
    expect(
      await popover.evaluate((element) => element.contains(document.activeElement)),
      `after Tab ${press + 1}`,
    ).toBe(true);
  }
});

test("the month buttons move between months", async ({ page }) => {
  await open(page, "light", "en");
  const popover = await openCalendar(page, "Due date");
  const heading = popover.locator('[data-slot="calendar-heading"]');
  const next = popover.locator('[data-slot="calendar-nav-button"][slot="next"]');
  const previous = popover.locator('[data-slot="calendar-nav-button"][slot="previous"]');
  await next.click();
  await expect(heading).toHaveText("April 2026");
  await previous.click();
  await previous.click();
  await expect(heading).toHaveText("February 2026");
  for (const button of [next, previous]) {
    const box = await boxOf(button);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("the bounded picker's calendar stops at the ends of its month", async ({ page }) => {
  await open(page, "light", "en");
  const popover = await openCalendar(page, "Booking date");
  await expect(popover.locator('[data-slot="calendar-nav-button"][slot="next"]')).toBeDisabled();
  await expect(
    popover.locator('[data-slot="calendar-nav-button"][slot="previous"]'),
  ).toBeDisabled();
});

test("weekends are unavailable in the invalid picker's calendar and refuse a press", async ({
  page,
}) => {
  await open(page, "light", "en");
  const popover = await openCalendar(page, "Delivery date");
  // Four Saturdays and five Sundays in March 2026; the days of April the grid pads with are not counted.
  await expect(popover.locator('[data-unavailable="true"]:not([data-outside-month])')).toHaveCount(
    9,
  );
  await dayOf(page, "Saturday, March 14").click({ force: true });
  await expect(popoverOf(page)).toBeVisible();
  await expect(segmentsOf(page, "Delivery date")).toHaveText(["3", "7", "2026"]);
  await dayOf(page, "Monday, March 9").click();
  await expect(popoverOf(page)).toBeHidden();
  await expect(segmentsOf(page, "Delivery date")).toHaveText(["3", "9", "2026"]);
  await expect(segmentOf(page, "Delivery date", "day")).not.toHaveAttribute("aria-invalid", "true");
});

test("a weekend day in the invalid picker is marked invalid and read with its error", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(segmentOf(page, "Delivery date", "day")).toHaveAttribute("aria-invalid", "true");
  await expect(
    pickerOf(page, "Delivery date").getByText("We do not deliver at weekends."),
  ).toBeVisible();
  await expect(
    pickerOf(page, "Delivery date").getByRole("group", { name: "Delivery date" }),
  ).toHaveAccessibleDescription(/We do not deliver at weekends\./);
});

test("a disabled picker cannot open, and a read-only one keeps focus but cannot open or change", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(triggerOf(page, "Cancelled on")).toBeDisabled();
  for (const segment of await segmentsOf(page, "Cancelled on").all())
    await expect(segment).toHaveAttribute("aria-disabled", "true");

  await expect(triggerOf(page, "Signed on")).toBeDisabled();
  const day = segmentOf(page, "Signed on", "day");
  await day.focus();
  await expect(day).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Alt+ArrowDown");
  await expect(popoverOf(page)).toHaveCount(0);
  await expect(segmentsOf(page, "Signed on")).toHaveText(["2", "12", "2026"]);
});

test("the live picker opens from outside, reports its open state and shows the day chosen", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const openState = live.getByTestId("date-picker-open");
  const value = live.getByTestId("date-picker-value");
  await expect(openState).toHaveText("The calendar is closed.");
  await expect(value).toHaveText("No day chosen yet.");

  await live.getByRole("button", { name: "Open the calendar" }).click();
  await settled(page);
  await expect(popoverOf(page)).toHaveAccessibleName("Choose the check-in date");
  await expect(openState).toHaveText("The calendar is open.");

  await dayOf(page, "Friday, March 6").click();
  await expect(popoverOf(page)).toBeHidden();
  await expect(openState).toHaveText("The calendar is closed.");
  await expect(value).toHaveText("Chosen day: 2026-03-06");
});

test("the live picker closes on Escape and reports it", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await triggerOf(page, "Check-in date").click();
  await settled(page);
  await expect(live.getByTestId("date-picker-open")).toHaveText("The calendar is open.");
  await page.keyboard.press("Escape");
  await expect(popoverOf(page)).toBeHidden();
  await expect(live.getByTestId("date-picker-open")).toHaveText("The calendar is closed.");
  await expect(live.getByTestId("date-picker-value")).toHaveText("No day chosen yet.");
});

test("the focused field shows a ring on its group and the focused button shows a ring", async ({
  page,
}) => {
  await open(page, "light", "en");
  await segmentOf(page, "Due date", "day").focus();
  expect(await hasRing(pickerOf(page, "Due date").locator('[data-slot="date-input-group"]'))).toBe(
    true,
  );
  await segmentOf(page, "Due date", "year").focus();
  await page.keyboard.press("Tab");
  const trigger = triggerOf(page, "Due date");
  await expect(trigger).toBeFocused();
  expect(await hasRing(trigger)).toBe(true);
});

for (const locale of LOCALES) {
  test(`the label sits at the reading-start side and the button at the reading-end side in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const picker = pickerOf(page, "Due date");
    const label = await boxOf(picker.locator('[data-slot="label"]'));
    const group = await boxOf(picker.locator('[data-slot="date-input-group"]'));
    const button = await boxOf(triggerOf(page, "Due date"));
    const buttonMiddle = button.x + button.width / 2;
    const groupMiddle = group.x + group.width / 2;
    if (locale === "en") {
      expect(label.x).toBeCloseTo(group.x, 0);
      expect(buttonMiddle > groupMiddle).toBe(true);
    } else {
      expect(label.x + label.width).toBeCloseTo(group.x + group.width, 0);
      expect(buttonMiddle < groupMiddle).toBe(true);
    }
  });

  test(`the calendar's weekdays and month buttons are mirrored in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const popover = await openCalendar(page, "Due date");
    const weekdays = popover.locator('[data-slot="calendar-header-cell"]');
    const first = await boxOf(weekdays.first());
    const last = await boxOf(weekdays.last());
    const next = popover.locator('[data-slot="calendar-nav-button"][slot="next"]');
    const previous = popover.locator('[data-slot="calendar-nav-button"][slot="previous"]');
    const nextBox = await boxOf(next);
    const previousBox = await boxOf(previous);
    if (locale === "en") {
      expect(last.x > first.x).toBe(true);
      expect(previousBox.x < nextBox.x).toBe(true);
      expect(await arrow(previous)).not.toBe("180deg");
      expect(await arrow(next)).not.toBe("180deg");
    } else {
      expect(last.x < first.x).toBe(true);
      expect(previousBox.x > nextBox.x).toBe(true);
      expect(await arrow(previous)).toBe("180deg");
      expect(await arrow(next)).toBe("180deg");
    }
  });

  test(`the calendar fits in the window in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const popover = await openCalendar(page, "Due date");
    const box = await boxOf(popover);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });
}
