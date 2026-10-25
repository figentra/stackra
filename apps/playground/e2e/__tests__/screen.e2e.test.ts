/**
 * Stackra file contract:
 * Purpose: the screen route's own end-to-end checks: axe finds nothing (violations or incomplete) on the page in light,
 *          dark, left-to-right and right-to-left; the page holds one `h1` and one `main`, because every sample is a plain
 *          `div`; the scrolling screen scrolls its own content, from the keyboard too, and the one that only holds its
 *          content clips it; the edge samples draw their padding from `env()` insets that are zero in a desktop browser,
 *          so none shifts its content; the Arabic screen starts its content at the right edge; the buttons reach 24 px;
 *          no part of the page overflows a 320 px window; and the live screen follows the scrolling switch and the edge
 *          checkboxes from the keyboard and reports them.
 * Boundary: the production build under `vite preview`; Chromium only. A desktop browser has no safe-area inset, so the
 *           edge classes are not visible here and the unit tests check them; the checks here are the ones a browser can
 *           make.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0317 (decisions 5 and 7); ADR 0060 (light, dark, RTL); ADR 0182 (test
 *          tiers); ADR 0022 (test placement); WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-177 sta-350:SC-012 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/screen?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Screen" })).toBeVisible();
};

/** Runs axe over the page and expects neither violations nor checks left for review. */
const expectAxeClean = async (page: Page) => {
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

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element has no box");
  return box;
};

/** One sample screen, by its `data-sample`. */
const sample = (page: Page, name: string) => page.locator(`[data-sample="${name}"]`);

/** How much of a sample's content is out of sight, and its vertical overflow rule. */
const scrollOf = (locator: Locator) =>
  locator.evaluate((element) => ({
    overflowY: getComputedStyle(element).overflowY,
    isTaller: element.scrollHeight > element.clientHeight,
    top: element.scrollTop,
  }));

const liveStatus = (page: Page) => page.locator('[data-sample="live-status"] [role="status"]');

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the screen page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await expectAxeClean(page);
    });

test("the page holds one h1 and one main, because every sample is a plain div", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  for (const name of ["all", "top", "bottom", "sides", "none", "scrolls", "holds", "live"])
    expect(await sample(page, name).evaluate((element) => element.tagName)).toBe("DIV");
});

test("the scrolling screen scrolls its own content, and the one that holds its content clips it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const scrolls = await scrollOf(sample(page, "scrolls"));
  expect(scrolls.overflowY).toBe("auto");
  expect(scrolls.isTaller).toBe(true);
  const holds = await scrollOf(sample(page, "holds"));
  expect(holds.overflowY).toBe("hidden");
  expect(holds.isTaller).toBe(true);
});

test("the scrolling screen scrolls from the keyboard", async ({ page }) => {
  await open(page, "light", "en");
  const screen = sample(page, "scrolls");
  await screen.getByRole("button", { name: "Press me" }).focus();
  await page.keyboard.press("PageDown");
  await expect.poll(async () => (await scrollOf(screen)).top).toBeGreaterThan(0);
});

test("a desktop browser has no safe area, so no edge sample shifts its content", async ({
  page,
}) => {
  await open(page, "light", "en");
  for (const name of ["all", "top", "bottom", "sides", "none"]) {
    const padding = await sample(page, name).evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight];
    });
    expect(padding, name).toEqual(["0px", "0px", "0px", "0px"]);
  }
});

test("a sample fills the box it is given and its content stays inside it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, "light", "en");
  const screen = sample(page, "all");
  const box = await boxOf(screen);
  const card = await boxOf(screen.locator("div").first());
  expect(card.x).toBeGreaterThanOrEqual(box.x);
  expect(card.x + card.width).toBeLessThanOrEqual(box.x + box.width + 1);
});

for (const locale of LOCALES)
  test(`the Arabic screen starts its content at the right edge in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const block = sample(page, "arabic");
    const blockBox = await boxOf(block);
    const button = await boxOf(block.getByRole("button", { name: "اضغط هنا" }));
    // The block is right-to-left whatever the page's direction: the first control sits in the right half.
    expect(button.x + button.width / 2).toBeGreaterThan(blockBox.x + blockBox.width / 2);
  });

test("every button in a sample reaches 24 px", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = page.locator("[data-sample]").getByRole("button");
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    const box = await boxOf(button);
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("no part of the page overflows a 320 px window", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page, "light", "en");
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(fits).toBe(true);
});

test("the live screen follows the switch and the edge checkboxes from the keyboard and reports them", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = sample(page, "live");
  await expect(liveStatus(page).nth(0)).toHaveText(
    "Scrolling is on. Kept clear: top, bottom, sides.",
  );
  expect((await scrollOf(live)).overflowY).toBe("auto");

  const toggle = page.getByRole("switch", { name: "Scrolls" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(0)).toHaveText(
    "Scrolling is off. Kept clear: top, bottom, sides.",
  );
  expect((await scrollOf(live)).overflowY).toBe("hidden");
  await expect(toggle).toBeFocused();

  const top = page.getByRole("checkbox", { name: "Top" });
  await top.focus();
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(0)).toHaveText("Scrolling is off. Kept clear: bottom, sides.");
  await expect(top).toBeFocused();

  const press = live.getByRole("button", { name: "Press me" });
  await press.focus();
  await page.keyboard.press("Enter");
  await expect(liveStatus(page).nth(1)).toHaveText("Pressed once.");
  await page.keyboard.press("Space");
  await expect(liveStatus(page).nth(1)).toHaveText("Pressed 2 times.");
});
