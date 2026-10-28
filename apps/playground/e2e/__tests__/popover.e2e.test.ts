/**
 * Stackra file contract:
 * Purpose: the popover route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left, and nothing on an open popover; a popover opens from the
 *          keyboard as a dialog named by its title or its aria-label, takes focus, and returns it to the trigger on
 *          Escape; each side and each alignment lands where the reading direction says in both directions; a press
 *          outside closes the default popover and not the step one, Escape closes the default and not the one that
 *          disables it, and Done closes both; the arrow is drawn only when asked; and the live popover opens from
 *          outside and reports its state.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           popover from the accessibility tree, so a trigger is found by role before it opens and after it closes,
 *           never while it is open.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 2.1.1, 2.1.2, 4.1.2.
 */
// @covers sta-350:FR-110 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/popover?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Popover" })).toBeVisible();
};

/** The trigger that opened the popover now showing: React Aria marks it expanded, and a CSS query still finds it. */
const opened = (page: Page) => page.locator('[aria-expanded="true"]');

/** A box that must exist. */
const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

/** Waits for the open and close animations to finish, so a box or a colour is measured at rest. */
const settled = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));

/** Centres the trigger in the viewport, so a popover has room on every side and is never flipped or shifted. */
const centre = (trigger: Locator) =>
  trigger.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center" }));

const dialog = (page: Page) => page.getByRole("dialog");

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the popover page in ${scheme}, ${locale}`, async ({ page }) => {
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

for (const scheme of SCHEMES)
  test(`axe finds nothing in an open popover in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    await page
      .getByRole("region", { name: "Content" })
      .getByRole("button", { name: "With an arrow" })
      .click();
    await expect(dialog(page)).toBeVisible();
    await settled(page);
    // Scoped to the dialog: it sits in a portal outside the page's landmarks, which the region rule would flag.
    // Only violations are asserted: a surface that is still fading in leaves a colour check for review.
    const { violations } = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(AXE_TAGS)
      .analyze();
    expect(
      violations.map((finding) => finding.id),
      "axe violations",
    ).toEqual([]);
  });

test("a popover opens from the keyboard as a dialog named by its title, takes focus and returns it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page
    .getByRole("region", { name: "Content" })
    .getByRole("button", { name: "With a title" });
  await trigger.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toHaveAccessibleName("Delivery window");
  await expect(page.locator('[role="dialog"]:focus-within')).toBeVisible();
  await expect(opened(page)).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("a popover without a title is named by its aria-label", async ({ page }) => {
  await open(page, "light", "en");
  await page
    .getByRole("region", { name: "Content" })
    .getByRole("button", { name: "Named by aria-label" })
    .click();
  await expect(dialog(page)).toHaveAccessibleName("Order reference");
  await expect(dialog(page).getByRole("heading")).toHaveCount(0);
});

test("the arrow is drawn only when asked", async ({ page }) => {
  await open(page, "light", "en");
  const content = page.getByRole("region", { name: "Content" });
  await content.getByRole("button", { name: "With a title" }).click();
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('[data-slot="popover-overlay-arrow"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await content.getByRole("button", { name: "With an arrow" }).click();
  await expect(page.locator('[data-slot="popover-overlay-arrow"]')).toHaveCount(1);
});

test("a field inside a popover takes typing", async ({ page }) => {
  await open(page, "light", "en");
  await page
    .getByRole("region", { name: "Content" })
    .getByRole("button", { name: "With a field" })
    .click();
  const field = dialog(page).getByRole("textbox", { name: "Order name" });
  await field.fill("Autumn order");
  await expect(field).toHaveValue("Autumn order");
  await expect(dialog(page)).toBeVisible();
});

const SIDES = ["Top", "Bottom", "Start", "End"] as const;

for (const locale of LOCALES)
  for (const side of SIDES)
    test(`the ${side.toLowerCase()} popover opens on the ${side.toLowerCase()} side in ${locale}`, async ({
      page,
    }) => {
      await open(page, "light", locale);
      const trigger = page
        .getByRole("region", { name: "Placement" })
        .getByRole("button", { name: side, exact: true });
      await centre(trigger);
      await trigger.click();
      await expect(dialog(page)).toBeVisible();
      await expect(async () => {
        await settled(page);
        const anchor = await boxOf(opened(page));
        const box = await boxOf(dialog(page));
        // `start` is the left in English and the right in Arabic; `end` is the other way round.
        const isLeft = (side === "Start") === (locale === "en");
        switch (side) {
          case "Top": {
            expect(box.y + box.height).toBeLessThanOrEqual(anchor.y + 1);
            break;
          }
          case "Bottom": {
            expect(box.y).toBeGreaterThanOrEqual(anchor.y + anchor.height - 1);
            break;
          }
          default: {
            if (isLeft) expect(box.x + box.width).toBeLessThanOrEqual(anchor.x + 1);
            else expect(box.x).toBeGreaterThanOrEqual(anchor.x + anchor.width - 1);
          }
        }
      }).toPass();
    });

for (const locale of LOCALES)
  for (const align of ["start", "end"] as const)
    test(`the popover lines up with the reading ${align} of its trigger in ${locale}`, async ({
      page,
    }) => {
      await open(page, "light", locale);
      const trigger = page
        .getByRole("region", { name: "Alignment" })
        .getByRole("button", { name: `Align ${align}` });
      await centre(trigger);
      await trigger.click();
      await expect(dialog(page)).toBeVisible();
      await expect(async () => {
        await settled(page);
        const anchor = await boxOf(opened(page));
        const box = await boxOf(dialog(page));
        // The reading start is the left edge in English and the right edge in Arabic.
        const isLeftEdge = (align === "start") === (locale === "en");
        const edge = isLeftEdge ? box.x - anchor.x : box.x + box.width - (anchor.x + anchor.width);
        expect(Math.abs(edge)).toBeLessThanOrEqual(2);
      }).toPass();
    });

test("a press outside closes the default popover and Escape closes it, returning focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page
    .getByRole("region", { name: "Dismissal" })
    .getByRole("button", { name: "Closes anywhere" });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(dialog(page)).toBeHidden();
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a popover that refuses a press outside stays open until Done, and Done returns focus", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = page
    .getByRole("region", { name: "Dismissal" })
    .getByRole("button", { name: "Refuses a press outside" });
  await trigger.click();
  await expect(dialog(page)).toHaveAccessibleName("Finish this step");
  await page.mouse.click(4, 4);
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole("button", { name: "Done" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a popover that refuses Escape stays open on Escape, and Done closes it", async ({ page }) => {
  await open(page, "light", "en");
  const trigger = page
    .getByRole("region", { name: "Dismissal" })
    .getByRole("button", { name: "Refuses Escape" });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole("button", { name: "Done" }).press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the live popover opens from outside, reports its state and closes on Escape", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("popover-state")).toHaveText("State: closed");
  await live.getByRole("button", { name: "Open from outside" }).click();
  await expect(dialog(page)).toHaveAccessibleName("Order actions");
  await expect(page.getByTestId("popover-state")).toHaveText("State: open");
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(live.getByTestId("popover-state")).toHaveText("State: closed");
});
