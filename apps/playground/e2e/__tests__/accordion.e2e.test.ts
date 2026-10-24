/**
 * Stackra file contract:
 * Purpose: the accordion route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, closed and with every section open; each title is a button in a heading with
 *          its state and its panel named by it; one open at a time closes the others while several-open does not; Enter
 *          and Space open a section from the keyboard and keep focus on its button; a disabled section and a disabled
 *          accordion refuse a press; the sections open at the start are open; the live example reports the open ids and
 *          follows the page's buttons; every button is a touch target of at least 24 pixels; and the indicator sits at
 *          the end side in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-140 sta-350:SC-002 sta-350:SC-011
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const SHIPPING = "How long does shipping take?";
const RETURNS = "Can I return an order?";
const WARRANTY = "Is there a warranty?";

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/accordion?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Accordion" })).toBeVisible();
};

const audit = async (page: Page) => {
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
    test(`axe finds nothing on the accordion page in ${scheme}, ${locale}`, async ({ page }) => {
      await open(page, scheme, locale);
      await audit(page);
    });

for (const [scheme, locale] of [
  ["light", "en"],
  ["dark", "ar"],
] as const)
  test(`axe finds nothing with every section open in ${scheme}, ${locale}`, async ({ page }) => {
    await open(page, scheme, locale);
    await page
      .getByRole("region", { name: "Try it" })
      .getByRole("button", { name: "Expand all" })
      .click();
    await page
      .getByRole("region", { name: "One open at a time" })
      .getByRole("button", { name: SHIPPING })
      .click();
    await audit(page);
  });

test("each title is a button in a heading, with its state and a panel named by it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const single = page.getByRole("region", { name: "One open at a time" });
  const shipping = single.getByRole("button", { name: SHIPPING });
  await expect(single.getByRole("heading", { name: SHIPPING })).toBeVisible();
  await expect(shipping).toHaveAttribute("aria-expanded", "false");
  await expect(single.getByRole("group", { name: SHIPPING })).toHaveCount(0);
  await shipping.click();
  await expect(shipping).toHaveAttribute("aria-expanded", "true");
  await expect(single.getByRole("group", { name: SHIPPING })).toBeVisible();
  await expect(single.getByRole("group", { name: SHIPPING })).toHaveText(
    "Orders ship within two working days.",
  );
});

test("one open at a time closes the others, and a press on the open one closes it", async ({
  page,
}) => {
  await open(page, "light", "en");
  const single = page.getByRole("region", { name: "One open at a time" });
  await single.getByRole("button", { name: SHIPPING }).click();
  await single.getByRole("button", { name: RETURNS }).click();
  await expect(single.getByRole("button", { name: SHIPPING })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(single.getByRole("button", { name: RETURNS })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await single.getByRole("button", { name: RETURNS }).click();
  await expect(single.locator('[aria-expanded="true"]')).toHaveCount(0);
});

test("several-open keeps each section open on its own", async ({ page }) => {
  await open(page, "light", "en");
  const multiple = page.getByRole("region", { name: "Several open" });
  await multiple.getByRole("button", { name: SHIPPING }).click();
  await multiple.getByRole("button", { name: RETURNS }).click();
  await expect(multiple.locator('[aria-expanded="true"]')).toHaveCount(2);
  await multiple.getByRole("button", { name: SHIPPING }).click();
  await expect(multiple.locator('[aria-expanded="true"]')).toHaveCount(1);
});

test("Enter and Space open a section and keep focus on its button", async ({ page }) => {
  await open(page, "light", "en");
  const multiple = page.getByRole("region", { name: "Several open" });
  const shipping = multiple.getByRole("button", { name: SHIPPING });
  await shipping.focus();
  await page.keyboard.press("Enter");
  await expect(shipping).toHaveAttribute("aria-expanded", "true");
  await expect(shipping).toBeFocused();
  await page.keyboard.press("Space");
  await expect(shipping).toHaveAttribute("aria-expanded", "false");
  await expect(shipping).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(multiple.getByRole("button", { name: RETURNS })).toBeFocused();
});

test("the sections told to be open at the start are open", async ({ page }) => {
  await open(page, "light", "en");
  const expanded = page.getByRole("region", { name: "Open at the start" });
  await expect(expanded.getByRole("button", { name: SHIPPING })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(expanded.getByRole("button", { name: RETURNS })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(expanded.getByRole("button", { name: WARRANTY })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("a disabled section and a disabled accordion refuse a press and leave the tab order", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  const refused = states.getByRole("button", { name: RETURNS }).first();
  await expect(refused).toBeDisabled();
  await refused.click({ force: true });
  await expect(refused).toHaveAttribute("aria-expanded", "false");

  const disabledOnes = states.locator("button:disabled");
  await expect(disabledOnes).toHaveCount(4);
  const kept = states.getByRole("button", { name: SHIPPING }).nth(1);
  await expect(kept).toHaveAttribute("aria-expanded", "true");
  await kept.click({ force: true });
  await expect(kept).toHaveAttribute("aria-expanded", "true");
});

test("the live example reports the open ids and follows the page's buttons", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("accordion-open")).toHaveText("Open: shipping");
  await live.getByRole("button", { name: WARRANTY }).click();
  await expect(live.getByTestId("accordion-open")).toHaveText("Open: shipping, warranty");
  await live.getByRole("button", { name: "Expand all" }).click();
  await expect(live.getByTestId("accordion-open")).toHaveText("Open: shipping, returns, warranty");
  await expect(live.locator('[aria-expanded="true"]')).toHaveCount(3);
  await live.getByRole("button", { name: "Collapse all" }).click();
  await expect(live.getByTestId("accordion-open")).toHaveText("Open: none");
  await expect(live.locator('[data-slot="accordion-trigger"][aria-expanded="true"]')).toHaveCount(
    0,
  );
});

test("a link in a section shows when the section is opened", async ({ page }) => {
  await open(page, "light", "en");
  const rich = page.getByRole("region", { name: "Rich content" });
  await expect(rich.getByRole("link")).toHaveCount(0);
  await rich.getByRole("button", { name: RETURNS }).click();
  await expect(rich.getByRole("link", { name: /Read the returns policy/ })).toBeVisible();
});

test("every section button is a touch target of at least 24 pixels", async ({ page }) => {
  await open(page, "light", "en");
  const buttons = page.getByRole("region", { name: "One open at a time" }).getByRole("button");
  for (let index = 0; index < (await buttons.count()); index += 1) {
    const box = await buttons.nth(index).boundingBox();
    if (!box) throw new Error(`no box for button ${index}`);
    expect(box.height, `button ${index} height`).toBeGreaterThanOrEqual(24);
    expect(box.width, `button ${index} width`).toBeGreaterThanOrEqual(24);
  }
});

for (const locale of LOCALES)
  test(`the indicator sits at the end side of its button in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const button = page
      .getByRole("region", { name: "One open at a time" })
      .locator('[data-slot="accordion-trigger"]')
      .first();
    const trigger = await button.boundingBox();
    const indicator = await button.locator('[data-slot="accordion-indicator"]').boundingBox();
    if (!trigger || !indicator) throw new Error("a box is missing");
    const middle = trigger.x + trigger.width / 2;
    expect(indicator.x + indicator.width / 2 > middle, locale).toBe(locale === "en");
  });
