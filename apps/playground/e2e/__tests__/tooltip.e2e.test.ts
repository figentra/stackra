/**
 * Stackra file contract:
 * Purpose: the tooltip route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in
 *          light, dark, left-to-right and right-to-left, and nothing on a shown tooltip; a tooltip shows on hover and on
 *          keyboard focus, describes its element without renaming it, stays while the pointer is over it and goes on
 *          Escape and on blur; each side and each alignment lands where the reading direction says in both
 *          directions; the arrow is drawn only when asked; a disabled tooltip never shows; and the live tooltip follows
 *          its switch and reports its state.
 * Boundary: the production build under `vite preview`; Chromium only. Unlike a popover, a tooltip leaves the page
 *           reachable by role while it is shown.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 1.4.13, 2.1.1, 4.1.2.
 */
// @covers sta-350:FR-111 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/tooltip?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tooltip" })).toBeVisible();
};

/** A box that must exist. */
const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

/** Waits for the open and close animations to finish, so a box or a colour is measured at rest. */
const settled = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));

/** Centres the element in the viewport, so a tooltip has room on every side and is never flipped or shifted. */
const centre = (element: Locator) =>
  element.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center" }));

/**
 * Waits until the element has stopped moving for a few frames, fonts included. React Aria closes an open tooltip on any
 * scroll of the page, so a late scroll (a font swap, or the scroll that focusing an element starts) would close a
 * tooltip the test has just opened.
 */
const atRest = (element: Locator) =>
  element.evaluate(async (node) => {
    await document.fonts.ready;
    let top = Number.NaN;
    for (let still = 0; still < 5;) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const next = node.getBoundingClientRect().top;
      still = next === top ? still + 1 : 0;
      top = next;
    }
  });

/** The tooltips on show: one that is fading out has been closed already, and a keyboard user passing by leaves one. */
const tooltip = (page: Page) => page.getByRole("tooltip").and(page.locator(":not([data-exiting])"));

/**
 * Hovers the element as a mouse user does. React Aria shows a tooltip on a hover only once it has seen the pointer move
 * on the page, and Playwright's own hover jumps straight onto the element, so the pointer first moves in the corner.
 */
const hover = async (page: Page, element: Locator) => {
  await page.mouse.move(2, 2);
  await element.hover();
};

/**
 * Focuses the element as a keyboard user does: React Aria shows a tooltip on keyboard focus only, and a script's own
 * `focus()` is not one, so focus steps off the element and back on with Shift+Tab and Tab.
 */
const focusByKeyboard = async (page: Page, element: Locator) => {
  await element.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(element).toBeFocused();
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the tooltip page in ${scheme}, ${locale}`, async ({ page }) => {
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
  test(`axe finds nothing on a shown tooltip in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    await focusByKeyboard(
      page,
      page.getByRole("region", { name: "Arrow" }).getByRole("button", { name: "With an arrow" }),
    );
    await expect(tooltip(page)).toBeVisible();
    await settled(page);
    // Scoped to the tooltip: it sits in a portal outside the page's landmarks, which the region rule would flag.
    // Only violations are asserted: a surface that is still fading in leaves a colour check for review.
    const { violations } = await new AxeBuilder({ page })
      .include('[role="tooltip"]')
      .withTags(AXE_TAGS)
      .analyze();
    expect(
      violations.map((finding) => finding.id),
      "axe violations",
    ).toEqual([]);
  });

test("a tooltip shows on keyboard focus, describes the button and leaves its name, and goes on Escape", async ({
  page,
}) => {
  await open(page, "light", "en");
  const button = page
    .getByRole("region", { name: "On icon buttons" })
    .getByRole("button", { name: "Settings" });
  await expect(tooltip(page)).toHaveCount(0);
  await focusByKeyboard(page, button);
  await expect(tooltip(page)).toHaveText("Change your preferences");
  await expect(button).toHaveAccessibleName("Settings");
  await expect(button).toHaveAccessibleDescription("Change your preferences");
  await page.keyboard.press("Escape");
  await expect(tooltip(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("a tooltip goes when focus leaves the button", async ({ page }) => {
  await open(page, "light", "en");
  const icons = page.getByRole("region", { name: "On icon buttons" });
  await focusByKeyboard(page, icons.getByRole("button", { name: "Alerts" }));
  await expect(tooltip(page)).toHaveText("See what needs your attention");
  await page.keyboard.press("Tab");
  await expect(icons.getByRole("button", { name: "Download" })).toBeFocused();
  await expect(tooltip(page)).toHaveText("Save the report as a file");
  await expect(tooltip(page)).toHaveCount(1);
});

test("a tooltip shows on hover and stays while the pointer is over it", async ({ page }) => {
  await open(page, "light", "en");
  const button = page
    .getByRole("region", { name: "Delay and switching off" })
    .getByRole("button", { name: "No delay" });
  await centre(button);
  await hover(page, button);
  await expect(tooltip(page)).toHaveText("Appears at once");
  await settled(page);
  const box = await boxOf(tooltip(page));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  await expect(tooltip(page)).toBeVisible();
  await page.mouse.move(2, 2);
  await expect(tooltip(page)).toHaveCount(0);
});

test("the arrow is drawn only when asked", async ({ page }) => {
  await open(page, "light", "en");
  const arrows = page.getByRole("region", { name: "Arrow" });
  await hover(page, arrows.getByRole("button", { name: "No arrow" }));
  await expect(tooltip(page)).toBeVisible();
  await expect(page.locator('[data-slot="overlay-arrow"]')).toHaveCount(0);
  await page.mouse.move(2, 2);
  await expect(tooltip(page)).toHaveCount(0);
  await hover(page, arrows.getByRole("button", { name: "With an arrow" }));
  await expect(tooltip(page)).toBeVisible();
  await expect(page.locator('[data-slot="overlay-arrow"]')).toHaveCount(1);
});

test("a disabled tooltip never shows, on hover or on focus", async ({ page }) => {
  await open(page, "light", "en");
  const button = page
    .getByRole("region", { name: "Delay and switching off" })
    .getByRole("button", { name: "Switched off" });
  await hover(page, button);
  await page.waitForTimeout(1200);
  await expect(tooltip(page)).toHaveCount(0);
  await focusByKeyboard(page, button);
  await expect(tooltip(page)).toHaveCount(0);
  await expect(button).not.toHaveAccessibleDescription(/never see/);
});

const SIDES = ["Top", "Bottom", "Start", "End"] as const;

for (const locale of LOCALES)
  for (const side of SIDES)
    test(`the ${side.toLowerCase()} tooltip opens on the ${side.toLowerCase()} side in ${locale}`, async ({
      page,
    }) => {
      await open(page, "light", locale);
      const button = page
        .getByRole("region", { name: "Placement" })
        .getByRole("button", { name: side, exact: true });
      await centre(button);
      await hover(page, button);
      await expect(tooltip(page)).toBeVisible();
      await expect(async () => {
        await settled(page);
        const anchor = await boxOf(button);
        const box = await boxOf(tooltip(page));
        // `start` is the left in English and the right in Arabic; `end` is the other way round.
        const isLeft = (side === "Start") === (locale === "en");
        switch (side) {
          case "Top":
            expect(box.y + box.height).toBeLessThanOrEqual(anchor.y + 1);
            break;
          case "Bottom":
            expect(box.y).toBeGreaterThanOrEqual(anchor.y + anchor.height - 1);
            break;
          default:
            if (isLeft) expect(box.x + box.width).toBeLessThanOrEqual(anchor.x + 1);
            else expect(box.x).toBeGreaterThanOrEqual(anchor.x + anchor.width - 1);
        }
      }).toPass();
    });

for (const locale of LOCALES)
  for (const align of ["start", "end"] as const)
    test(`the tooltip lines up with the reading ${align} of its button in ${locale}`, async ({
      page,
    }) => {
      await open(page, "light", locale);
      const button = page
        .getByRole("region", { name: "Alignment" })
        .getByRole("button", { name: `Align ${align}` });
      await centre(button);
      await hover(page, button);
      await expect(tooltip(page)).toBeVisible();
      await expect(async () => {
        await settled(page);
        const anchor = await boxOf(button);
        const box = await boxOf(tooltip(page));
        // The reading start is the left edge in English and the right edge in Arabic.
        const isLeftEdge = (align === "start") === (locale === "en");
        const edge = isLeftEdge ? box.x - anchor.x : box.x + box.width - (anchor.x + anchor.width);
        expect(Math.abs(edge)).toBeLessThanOrEqual(2);
      }).toPass();
    });

test("the live tooltip follows its switch and reports its state", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  const toggle = live.getByRole("switch", { name: "Show the tooltip" });
  await expect(live.getByTestId("tooltip-state")).toHaveText("State: hidden");
  await expect(tooltip(page)).toHaveCount(0);
  // From the keyboard: HeroUI's hidden input is overlapped by its drawn control, so a pointer click on it is refused.
  await toggle.scrollIntoViewIfNeeded();
  await toggle.focus();
  await atRest(toggle);
  await page.keyboard.press("Space");
  await expect(tooltip(page)).toHaveText("Export the table as CSV");
  await expect(live.getByTestId("tooltip-state")).toHaveText("State: shown");
  await page.keyboard.press("Space");
  await expect(tooltip(page)).toHaveCount(0);
  await expect(live.getByTestId("tooltip-state")).toHaveText("State: hidden");
});
