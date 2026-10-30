/**
 * Stackra file contract:
 * Purpose: the Theme Studio's end-to-end checks.
 *          - A link with knobs opens the derived theme in the preview.
 *          - A slider writes its knob to the address, and the changes-only export then carries it.
 *          - Undo takes it back.
 *          - Picking a brand sets every control from its theme, a brand written in hex included.
 *          - The iPhone frame's corners do not follow the theme's radius, and nothing overflows it.
 *          - Copy link (in the Display popover) says so in a toast, and the link reopens the same brand and knobs in
 *            a fresh browser.
 *          - The exported JSON, in the inspector that Export opens, imports back to the same theme.
 *          - A bad import is refused with the reason.
 *          - The page passes axe with a custom accent in both schemes and directions.
 *          The route itself is also in the general suite's light, dark, LTR and RTL run.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Opens the top bar's Display popover, which holds the preview, zoom, language and link controls. */
const openDisplay = async (page: Page) => {
  await page.getByRole("button", { name: /^(Display|العرض)$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
};

/** Export opens the inspector (folded by default below 80rem), where the export and import sit. */
const openExport = (page: Page) =>
  page.getByRole("button", { name: "Export", exact: true }).click();

const previewVariable = (page: Page, name: string) =>
  page
    .getByRole("region", { name: "Canvas" })
    .locator("[data-theme]")
    .evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), name);

test("a link with knobs opens the derived theme on the canvas", async ({ page }) => {
  await page.goto("/theme-studio?scheme=light&locale=en&accent=40,0.16&radius=8");
  // A hue keeps the base accent's lightness: a fresh browser opens on Stackra steel, #647282 (L 0.546).
  expect(await previewVariable(page, "--accent")).toBe("oklch(0.546 0.16 40)");
  expect(await previewVariable(page, "--radius")).toBe("8px");
});

test("a slider writes the address and the changes-only export; undo takes it back", async ({
  page,
}) => {
  await page.goto("/theme-studio?scheme=light&locale=en");
  await page.getByRole("button", { name: "Shape" }).click();
  await page.getByRole("slider", { name: "Corner radius" }).fill("12");
  await expect(page).toHaveURL(/radius=12/);
  await openExport(page);
  await page.getByRole("button", { name: "Format" }).click();
  await page.getByRole("option", { name: "Changes" }).click();
  await expect(page.getByRole("region", { name: /the export/ })).toContainText('"base": "12px"');
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page).not.toHaveURL(/radius=/);
});

test("picking a brand sets every control from its theme, hex brands included", async ({ page }) => {
  await page.goto("/theme-studio?scheme=dark&locale=en");
  await page.locator("label", { has: page.locator('input[value="jute"]') }).click();
  // The value a slider shows: the <output> beside its own <label>.
  const output = (label: string) => page.locator(`div:has(> label:text-is("${label}")) > output`);
  // Jute writes its accent #642254 and border #E3DFCB in hex: the controls read them, not Stackra's 248°.
  await expect(output("Accent hue")).toHaveText("338°");
  await expect(output("Accent strength")).toHaveText("0.11");
  await expect(output("Neutral hue")).toHaveText("98°");
  await page.getByRole("button", { name: "Shape" }).click();
  await expect(output("Corner radius")).toHaveText("12px");
  await page.getByRole("button", { name: "Type" }).click();
  await expect(page.getByRole("button", { name: /Latin display face/ })).toContainText(
    "Bricolage Grotesque",
  );
});

test("the iPhone frame keeps its corners whatever the theme's radius", async ({ page }) => {
  const corner = async (radius: number) => {
    await page.goto(`/theme-studio?scheme=light&locale=en&radius=${radius}`);
    await page.getByRole("radio", { name: "iPhone", exact: true }).click();
    return page
      .getByRole("region", { name: "Canvas" })
      .locator("figure")
      .evaluate((figure) => getComputedStyle(figure).borderTopLeftRadius);
  };
  expect(await corner(0)).toBe(await corner(24));
  const figure = page.getByRole("region", { name: "Canvas" }).locator("figure");
  expect(await figure.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("copy link announces itself in a toast and the link reopens the same theme", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/theme-studio?scheme=light&locale=en&accent=150,0.12&radius=6");
  await page.locator("label", { has: page.locator('input[value="tamo"]') }).click();
  await page.getByRole("button", { name: "Shape" }).click();
  await page.getByRole("slider", { name: "Corner radius" }).fill("9");
  await openDisplay(page);
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied.")).toBeVisible();
  // The toast floats: the rail's first section does not move down for it.
  await expect(page.getByRole("navigation", { name: /./ }).locator("> p")).toHaveCount(0);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("brand=tamo");
  const fresh = await context.newPage();
  await fresh.addInitScript(() => localStorage.clear());
  await fresh.goto(link);
  expect(await previewVariable(fresh, "--radius")).toBe("9px");
  await expect(fresh.getByRole("radio", { name: "Tamo" })).toBeChecked();
});

test("the exported JSON imports back to the same theme", async ({ page }) => {
  await page.goto("/theme-studio?scheme=light&locale=en&accent=295,0.15&hue=290&radius=10");
  await openExport(page);
  const code = page.getByRole("region", { name: /the export/ });
  const exported = (await code.textContent()) ?? "";
  await page.getByRole("textbox", { name: "Paste a theme JSON" }).fill(exported);
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(/Imported theme/).first()).toBeVisible();
  expect(JSON.parse((await code.textContent()) ?? "")).toEqual(JSON.parse(exported));
});

test("a bad import is refused with the reason", async ({ page }) => {
  await page.goto("/theme-studio?scheme=dark&locale=en");
  await openExport(page);
  await page.getByRole("textbox", { name: "Paste a theme JSON" }).fill('{"format":"figma/9"}');
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByRole("alert")).toContainText('"figma/9" is not a theme format');
});

for (const scheme of ["light", "dark"] as const)
  for (const locale of ["en", "ar"] as const)
    test(`a custom theme passes axe in ${scheme}, ${locale}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      // The studio is a desktop workspace; at 720px a rail row straddles the window's edge, where axe cannot read
      // the background behind it.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/theme-studio?scheme=${scheme}&locale=${locale}&accent=295,0.15&hue=290`);
      // At its real size: "fit" shrinks the canvas, and axe would measure the shrunk rows as small targets.
      await openDisplay(page);
      await page.getByRole("radio", { name: "100%", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
      expect(incomplete.map((v) => v.id)).toEqual([]);
    });
