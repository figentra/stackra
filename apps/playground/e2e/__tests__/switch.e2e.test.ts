/**
 * Stackra file contract:
 * Purpose: the switch route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; every switch is named by its label or its aria-label; Space toggles a
 *          focused switch and a click on its label does too; disabled and read-only switches do not change; the thumb
 *          moves toward the end of the reading direction when on, in both directions; an on switch stands 3:1 from the
 *          page; and the readout follows the live settings.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.4.11, 2.1.1, 4.1.2; ADR 0060 (right-to-left); ADR 0182
 *          (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-086 sta-350:FR-087 sta-350:FR-089 sta-350:SC-002 sta-350:SC-005
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/switch?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Switch" })).toBeVisible();
};

/** A computed colour as `#rrggbb`, composited over `base`: drawn on a canvas, so any CSS colour form reads. */
const paintedOver = (locator: Locator, property: "color" | "backgroundColor", base: string) =>
  locator.evaluate(
    (element, { name, under }) => {
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no 2d canvas");
      context.fillStyle = under;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = getComputedStyle(element)[name];
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    },
    { name: property, under: base },
  );

/** The switch root that holds the input named `name`. */
const rootOf = (page: Page, name: string) =>
  page.locator('[data-slot="switch"]').filter({ has: page.getByRole("switch", { name }) });

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the switch page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("every switch has an accessible name", async ({ page }) => {
  await open(page, "light", "en");
  const switches = page.locator("article").getByRole("switch");
  const count = await switches.count();
  expect(count).toBeGreaterThan(8);
  for (let index = 0; index < count; index += 1) {
    const name = await switches.nth(index).evaluate((element) => {
      const input = element as HTMLInputElement;
      return (
        input.getAttribute("aria-label") ??
        [...(input.labels ?? [])].map((label) => label.textContent?.trim()).join(" ")
      );
    });
    expect(name, `switch ${index}`).toBeTruthy();
  }
});

test("Space toggles a focused switch, and a click on its label does too", async ({ page }) => {
  await open(page, "light", "en");
  const control = page.getByRole("switch", { name: "Airplane mode" });
  await control.focus();
  await expect(control).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(control).toBeChecked();
  await page.getByText("Airplane mode", { exact: true }).click();
  await expect(control).not.toBeChecked();
});

test("disabled and read-only switches do not change", async ({ page }) => {
  await open(page, "light", "en");
  await expect(page.getByRole("switch", { name: "Bluetooth" })).toBeDisabled();
  const readOnly = page.getByRole("switch", { name: "Cloud backup" });
  await expect(readOnly).toBeChecked();
  await readOnly.focus();
  await page.keyboard.press("Space");
  await expect(readOnly).toBeChecked();
  await expect(readOnly).toBeFocused();
});

test("the required switch is required, and the invalid one is described by its message", async ({
  page,
}) => {
  await open(page, "light", "en");
  await expect(
    page.getByRole("switch", { name: /Allow the app to run in the background/ }),
  ).toHaveJSProperty("required", true);
  const invalid = page.getByRole("switch", { name: "Share my profile" });
  await expect(invalid).toHaveAccessibleDescription("Turn this on to continue.");
  await invalid.focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Turn this on to continue.")).toBeHidden();
});

for (const locale of LOCALES)
  test(`the thumb moves toward the end of the reading direction when on, in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const root = rootOf(page, "Airplane mode");
    const thumb = root.locator('[data-slot="switch-thumb"]');
    const before = await thumb.boundingBox();
    if (!before) throw new Error("the thumb has no box");
    await root.getByText("Airplane mode", { exact: true }).click();
    await expect(page.getByRole("switch", { name: "Airplane mode" })).toBeChecked();
    // The thumb slides on a transition; poll until it has left its start.
    await expect.poll(async () => (await thumb.boundingBox())?.x).not.toBe(before.x);
    const after = await thumb.boundingBox();
    if (!after) throw new Error("the thumb has no box");
    expect(after.x > before.x, locale).toBe(locale === "en");
  });

for (const scheme of SCHEMES)
  test(`an on switch stands 3:1 from the page in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const pageBackground = await paintedOver(page.locator("body"), "backgroundColor", "#ffffff");
    const control = rootOf(page, "Wi-Fi").locator('[data-slot="switch-control"]');
    const fill = await paintedOver(control, "backgroundColor", pageBackground);
    expect(
      contrastRatio(fill, pageBackground),
      `${fill} on ${pageBackground}`,
    ).toBeGreaterThanOrEqual(3);
  });

test("the readout follows the live settings", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByRole("status")).toHaveText("On: Dark theme");
  await live.getByText("Beta features", { exact: true }).click();
  await expect(live.getByRole("status")).toHaveText("On: Dark theme, Beta features");
  await live.getByText("Dark theme", { exact: true }).click();
  await live.getByText("Beta features", { exact: true }).click();
  await expect(live.getByRole("status")).toHaveText("On: nothing");
});
