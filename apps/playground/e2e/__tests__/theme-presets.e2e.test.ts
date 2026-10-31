/**
 * Stackra file contract:
 * Purpose: the visual-regression pass of the theme presets (ADR 0501): for each preset and scheme the button page
 *          draws the preset's own tokens (the button's radius, the field's height and edge, the table header's
 *          height) and a screenshot of the examples is attached to the report, so a reviewer compares presets run by
 *          run. A field and a button of one size stand the same height in every preset.
 * Boundary: the production build under `vite preview`; Chromium only. The preset is picked the way the Theme Studio
 *          picks it (the stored brand id). Screenshots are attached, not compared against stored baselines.
 * Runtime: node
 * Governing contract: ADR 0501 (tokens v2, section 4); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { expect, test, type Page } from "@playwright/test";

/** Each preset with the button radius and field edge its tokens set. */
const PRESETS = [
  { id: "stackra", radius: "4px", fieldEdge: "1px" },
  { id: "heroui", radius: "9999px", fieldEdge: "0px" },
  { id: "tactile", radius: "9999px", fieldEdge: "0px" },
  { id: "glass", radius: "12px", fieldEdge: "1px" },
  { id: "brutal", radius: "0px", fieldEdge: "2px" },
] as const;

const SCHEMES = ["light", "dark"] as const;

/** Opens `path` wearing `preset` in `scheme`. */
const open = async (page: Page, path: string, preset: string, scheme: string) => {
  await page.addInitScript((id) => localStorage.setItem("stackra-playground:brand", id), preset);
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`${path}?scheme=${scheme}&locale=en`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

for (const preset of PRESETS)
  for (const scheme of SCHEMES)
    test(`${preset.id} ${scheme}: the preset's tokens reach the components`, async ({
      page,
    }, info) => {
      await open(page, "/text-field", preset.id, scheme);
      const field = await page
        .locator("section#examples .input")
        .first()
        .evaluate((input) => ({
          height: input.getBoundingClientRect().height,
          edge: getComputedStyle(input).borderTopWidth,
        }));
      expect(field.edge).toBe(preset.fieldEdge);
      expect(field.height).toBe(36);

      await open(page, "/button", preset.id, scheme);
      const button = page
        .locator("section#examples .button--primary:not(.button--sm, .button--lg)")
        .first();
      expect(await button.evaluate((element) => getComputedStyle(element).borderRadius)).toBe(
        preset.radius,
      );
      expect(await button.evaluate((element) => element.getBoundingClientRect().height)).toBe(36);
      await info.attach(`${preset.id}-${scheme}-button`, {
        body: await page.locator("section#examples").first().screenshot(),
        contentType: "image/png",
      });

      await open(page, "/data-table", preset.id, scheme);
      expect(
        await page
          .locator("section#examples th")
          .first()
          .evaluate((th) => th.getBoundingClientRect().height),
      ).toBe(36);
    });
