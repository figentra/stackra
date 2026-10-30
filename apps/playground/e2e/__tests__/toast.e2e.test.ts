/**
 * Stackra file contract:
 * Purpose: the toast route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page and, with
 *          each tone's toast showing, on the toast region, in light, dark, left-to-right and right-to-left; a warning
 *          or a failure is announced as an alert and the rest as polite statuses; each toast draws a 16 px decorative
 *          icon on the reading-start side and a visible 24 px dismiss button on the reading-end side; the keyboard
 *          reaches the toasts with Alt and T, dismisses one and gives focus back; an action runs and closes its toast;
 *          a toast leaves by itself after its timeout and one with a timeout of 0 stays; and the switch moves the
 *          region to the top, centred in both directions.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay, and a toast region is not one, so role queries work on the page; the toasts themselves are found
 *           by their `data-slot`, as their parts carry no role of their own to query.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312 (decisions 2 and 3); ADR 0182 (test tiers); ADR 0022 (test
 *          placement); WCAG 2.2 SC 2.1.1, 2.2.1, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-116 sta-350:SC-002 sta-350:SC-010
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Each tone, the message its button shows and whether it is announced at once. */
const TONES = [
  { tone: "default", message: "Draft autosaved", isUrgent: false },
  { tone: "accent", message: "A new version is available", isUrgent: false },
  { tone: "success", message: "Changes saved", isUrgent: false },
  { tone: "warning", message: "Storage is almost full", isUrgent: true },
  { tone: "danger", message: "Payment failed", isUrgent: true },
] as const;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/toast?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Toast", locale) }),
  ).toBeVisible();
  // The page's one ToastProvider is mounted by the lazily loaded control example: a toast shown before it is lost.
  await expect(example(page, "control").getByRole("switch")).toBeAttached();
};

/** The toast region and the toasts in it: found by data-slot, since the region is a portal outside `main`. */
const regionOf = (page: Page) => page.locator('[data-slot="toast-region"]');
const toastsOf = (page: Page) => page.locator('[data-slot="toast"]');

// By position, in the order of TONES: the Usage buttons are named in the page's locale.
const showTone = (page: Page, tone: string) =>
  example(page, "usage")
    .getByRole("button")
    .nth(TONES.findIndex((entry) => entry.tone === tone))
    .click();

/** "Dismiss all toasts", the second button of the control example, by position for the same reason. */
const dismissAll = (page: Page) => example(page, "control").getByRole("button").nth(1);

const analyze = async (page: Page, include?: string) => {
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  const { violations, incomplete } = await (include ? builder.include(include) : builder).analyze();
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
  for (const locale of LOCALES) {
    test(`axe finds nothing on the toast page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await analyze(page);
    });

    test(`axe finds nothing on each tone's toast in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      for (const { tone } of TONES) {
        await showTone(page, tone);
        await expect(toastsOf(page)).toHaveCount(1);
        await expect(toastsOf(page).first()).toBeVisible();
        // At rest: under reduced motion a toast still fades in, and axe measured a title mid-fade.
        await expect
          .poll(() =>
            toastsOf(page)
              .first()
              .evaluate((element) => getComputedStyle(element).opacity),
          )
          .toBe("1");
        await analyze(page, '[data-slot="toast-region"]');
        await dismissAll(page).click();
        await expect(toastsOf(page)).toHaveCount(0);
      }
    });
  }

test("a warning or a failure is announced as an alert, the rest as polite statuses", async ({
  page,
}) => {
  await open(page, "light", "en");
  for (const { tone, message, isUrgent } of TONES) {
    await showTone(page, tone);
    const content = toastsOf(page)
      .filter({ hasText: message })
      .locator('[data-slot="toast-content"]');
    await expect(content, tone).toHaveAttribute("role", isUrgent ? "alert" : "status");
    await expect(content, tone).toHaveAttribute("aria-live", isUrgent ? "assertive" : "polite");
    await expect(content, tone).toHaveAttribute("aria-atomic", "true");
  }
});

for (const locale of LOCALES)
  test(`each toast draws a 16 px decorative icon at the reading start and a visible 24 px dismiss button at the end in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    await showTone(page, "success");
    const toast = toastsOf(page).first();
    await expect(toast).toBeVisible();
    const icon = toast.locator('[data-slot="toast-indicator"] svg');
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    const dismiss = toast.locator('[data-slot="toast-close"]');
    const [iconBox, dismissBox, toastBox, textBox] = await Promise.all([
      icon.boundingBox(),
      dismiss.boundingBox(),
      toast.boundingBox(),
      toast.locator('[data-slot="toast-content"]').boundingBox(),
    ]);
    if (!iconBox || !dismissBox || !toastBox || !textBox) throw new Error("a box is missing");
    expect([Math.round(iconBox.width), Math.round(iconBox.height)]).toEqual([16, 16]);
    expect(dismissBox.width).toBeGreaterThanOrEqual(24);
    expect(dismissBox.height).toBeGreaterThanOrEqual(24);
    // HeroUI hides the button until the pointer is over the toast: it must be drawn without that.
    expect(await dismiss.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    expect(iconBox.x < textBox.x, `icon ${locale}`).toBe(locale === "en");
    const toastMiddle = toastBox.x + toastBox.width / 2;
    expect(dismissBox.x + dismissBox.width / 2 > toastMiddle, `dismiss ${locale}`).toBe(
      locale === "en",
    );
  });

test("the dismiss button is named by dismissLabel and closes its toast", async ({ page }) => {
  await open(page, "light", "en");
  await showTone(page, "success");
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  await expect(dismiss).toBeVisible();
  await dismiss.click();
  await expect(toastsOf(page)).toHaveCount(0);
});

test("the keyboard reaches a toast with Alt and T, dismisses it and gives focus back", async ({
  page,
}) => {
  await open(page, "light", "en");
  const trigger = example(page, "options").getByRole("button", { name: "Stays until dismissed" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(toastsOf(page).filter({ hasText: "Upload paused" })).toBeVisible();

  await page.keyboard.press("Alt+KeyT");
  await expect(regionOf(page)).toBeFocused();
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  for (
    let step = 0;
    step < 4 && !(await dismiss.evaluate((el) => el === document.activeElement));
    step++
  )
    await page.keyboard.press("Tab");
  await expect(dismiss).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toastsOf(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("an action runs once and closes its toast", async ({ page }) => {
  await open(page, "light", "en");
  await example(page, "options").getByRole("button", { name: "With an action" }).click();
  const deleted = toastsOf(page).filter({ hasText: "Order deleted" });
  await expect(deleted).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(toastsOf(page).filter({ hasText: "Order restored" })).toBeVisible();
  await expect(deleted).toHaveCount(0);
  await expect(toastsOf(page).filter({ hasText: "Order restored" })).toHaveCount(1);
});

test("a toast leaves by itself after its timeout and one with a timeout of 0 stays", async ({
  page,
}) => {
  await open(page, "light", "en");
  await showTone(page, "default");
  await example(page, "options").getByRole("button", { name: "Stays until dismissed" }).click();
  const fleeting = toastsOf(page).filter({ hasText: "Draft autosaved" });
  const staying = toastsOf(page).filter({ hasText: "Upload paused" });
  await expect(fleeting).toBeVisible();
  await expect(fleeting).toHaveCount(0, { timeout: 10_000 });
  await expect(staying).toBeVisible();
});

test("four toasts stack and Dismiss all closes them", async ({ page }) => {
  await open(page, "light", "en");
  const control = example(page, "control");
  // The motion wave's control demo stacks four: saved, syncing, offline and a mention with an avatar.
  await control.getByRole("button", { name: "Show four toasts" }).click();
  await expect(toastsOf(page)).toHaveCount(4);
  await control.getByRole("button", { name: "Dismiss all toasts" }).click();
  await expect(toastsOf(page)).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the toasts sit at the bottom, centred, and at the top with the switch in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    await showTone(page, "success");
    // The toast, not the region: the region holds only absolutely placed toasts, so it has no height of its own.
    const middleOf = async () => {
      const box = await toastsOf(page).first().boundingBox();
      if (!box) throw new Error("the toast has no box");
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    await expect(toastsOf(page).first()).toBeVisible();
    let middle = await middleOf();
    expect(middle.y).toBeGreaterThan(viewport.height / 2);
    expect(Math.abs(middle.x - viewport.width / 2)).toBeLessThan(2);

    // From the keyboard: HeroUI's hidden input is overlapped by its drawn control, so a pointer click on it is refused.
    await example(page, "control").getByRole("switch").focus();
    await page.keyboard.press("Space");
    await expect(regionOf(page)).toHaveClass(/toast-region--top/);
    middle = await middleOf();
    expect(middle.y).toBeLessThan(viewport.height / 2);
    expect(Math.abs(middle.x - viewport.width / 2)).toBeLessThan(2);
  });
