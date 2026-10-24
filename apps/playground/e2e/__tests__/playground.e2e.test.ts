/**
 * Stackra file contract:
 * Purpose: the playground's end-to-end and accessibility gate: every route, found by listing `src/routes/`, opened in
 *          light and dark and in left-to-right (en) and right-to-left (ar) through the URL, must render its h1, title
 *          the document after it, carry the scheme and direction on <html>, and pass axe (WCAG 2.0 to 2.2, A and AA,
 *          and best practices) with no violation and nothing left incomplete. The switcher's selected choice must
 *          stand 3:1 from the others in both schemes and work from the keyboard in right-to-left, and the `system`
 *          scheme must follow the system preference live. The command palette opens from the keyboard and lands focus
 *          on the page it opens, a component page marks itself in its category strip, and the glass turns solid
 *          when more contrast is asked for, and the index passes axe in every material mode (ADR 0320). A new route folder is covered without editing this file.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-350:FR-011 sta-350:P-007 sta-350:SC-002
import { readdirSync } from "node:fs";

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";
import { contrastRatio } from "@stackra/tokens";
import { MaterialMode } from "@stackra/tokens/contracts";

/** Each route folder's path: `/` for `home`, `/<folder>` for the others (the route classes follow this). */
const ROUTES = readdirSync(new URL("../../src/routes", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => (entry.name === "home" ? "/" : `/${entry.name}`));

const SCHEMES = ["light", "dark"] as const;
const LOCALES = [
  { locale: "en", dir: "ltr" },
  { locale: "ar", dir: "rtl" },
] as const;

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** The background an element paints, as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const paintedBackground = (locator: Locator) =>
  locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });

/**
 * The incomplete axe results a route's own suite measures instead, by route: a rule id and the markup its nodes carry.
 * A translucent badge straddles its anchor's corner, so the background under its count is part disc and part page and
 * axe leaves a one-character count for review; `badge.e2e.test.ts` measures every badge label against both.
 */
const MEASURED_INSTEAD: Readonly<Record<string, { rule: string; markup: string }>> = {
  "/badge": { rule: "color-contrast", markup: 'data-slot="badge-label"' },
};

test("the route list is not empty", () => {
  expect(ROUTES).toContain("/foundations");
});

for (const path of ROUTES)
  for (const scheme of SCHEMES)
    for (const { locale, dir } of LOCALES)
      test(`${path} in ${scheme}, ${dir}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(`${path}?scheme=${scheme}&locale=${locale}`);

        const heading = page.getByRole("heading", { level: 1 });
        await expect(heading).toBeVisible();
        await expect(page).toHaveTitle(new RegExp(`^${await heading.textContent()}`));
        const html = page.locator("html");
        await expect(html).toHaveAttribute("data-theme", scheme);
        await expect(html).toHaveClass(new RegExp(`\\b${scheme}\\b`));
        await expect(html).toHaveAttribute("dir", dir);
        await expect(html).toHaveAttribute("lang", locale);

        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags(AXE_TAGS)
          .analyze();
        const measured = MEASURED_INSTEAD[path];
        const unsettled = incomplete
          .map((v) => ({
            ...v,
            nodes: v.nodes.filter(
              (n) => !(measured && v.id === measured.rule && n.html.includes(measured.markup)),
            ),
          }))
          .filter((v) => v.nodes.length > 0);
        const report = (results: typeof violations) =>
          results.map(
            (v) =>
              `${v.id} (${v.impact}): ${v.nodes
                .map((n) => `${n.target.join(" ")} ${n.failureSummary ?? ""}`)
                .join(" | ")}`,
          );
        expect(report(violations), "axe violations").toEqual([]);
        expect(report(unsettled), "axe checks left for review").toEqual([]);
      });

for (const scheme of SCHEMES)
  test(`the system scheme follows the system's ${scheme} preference, live`, async ({ page }) => {
    const other = scheme === "dark" ? "light" : "dark";
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/foundations?scheme=system&locale=en");
    const html = page.locator("html");
    await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(html).toHaveAttribute("data-theme", scheme);
    await expect(html).toHaveClass(new RegExp(`\\b${scheme}\\b`));
    await page.emulateMedia({ colorScheme: other });
    await expect(html).toHaveAttribute("data-theme", other);
    await expect(html).not.toHaveClass(new RegExp(`\\b${scheme}\\b`));
  });

for (const scheme of SCHEMES)
  test(`the selected switcher choice stands 3:1 or more from the others in ${scheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`/?scheme=${scheme}&locale=en`);
    const selected = page.getByRole("radio", { name: scheme === "dark" ? "Dark" : "Light" });
    await expect(selected).toHaveAttribute("aria-checked", "true");
    for (const name of ["System", scheme === "dark" ? "Light" : "Dark"]) {
      const unselected = page.getByRole("radio", { name });
      await expect(unselected).toHaveAttribute("aria-checked", "false");
      const ratio = contrastRatio(
        await paintedBackground(selected),
        await paintedBackground(unselected),
      );
      expect(ratio, `${scheme}: selected against ${name}`).toBeGreaterThanOrEqual(3);
    }
  });

test("the switcher works from the keyboard in right-to-left: arrows follow the direction, Space picks", async ({
  page,
}) => {
  await page.goto("/foundations?scheme=light&locale=ar");
  const light = page.getByRole("radio", { name: "Light" });
  const dark = page.getByRole("radio", { name: "Dark" });
  // Mirrored: the next choice sits to the left, and ArrowLeft moves to it.
  expect((await dark.boundingBox())?.x).toBeLessThan((await light.boundingBox())?.x ?? 0);
  await light.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(dark).toBeFocused();
  await expect(dark).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await expect(light).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page).toHaveURL(/scheme=dark/);
  await page.keyboard.press("ArrowRight");
  await expect(light).toBeFocused();
});

test("the switcher writes the scheme and direction to the URL and the document", async ({
  page,
}) => {
  await page.goto("/foundations?scheme=light&locale=en");
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("radio", { name: /العربية/ }).click();
  await expect(page).toHaveURL(/scheme=dark/);
  await expect(page).toHaveURL(/locale=ar/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    "content",
    "#0B0D0F",
  );
});

test("a client-side navigation titles the document and moves focus to the new h1", async ({
  page,
}) => {
  await page.goto("/?scheme=light&locale=en");
  await page.getByRole("navigation", { name: "Pages" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/foundations\?/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle("Foundations · Stackra Playground");
});

test("the command palette opens from the keyboard, filters, and Enter opens the match with focus on its h1", async ({
  page,
}) => {
  await page.goto("/?scheme=light&locale=en");
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Search components" });
  await expect(palette).toBeVisible();
  await expect(palette.getByRole("searchbox")).toBeFocused();
  await page.keyboard.type("check");
  await expect(palette.getByRole("link", { name: "Checkbox", exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/checkbox\?scheme=light&locale=en$/);
  await expect(palette).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("Escape closes the command palette and hands focus back to the search button", async ({
  page,
}) => {
  await page.goto("/foundations?scheme=dark&locale=ar");
  const trigger = page.getByRole("button", { name: /Search components/ });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Search components" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search components" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a component page marks itself in its category strip and links the pages before and after it", async ({
  page,
}) => {
  await page.goto("/button?scheme=light&locale=en");
  const strip = page.getByRole("navigation", { name: "Pages" });
  await expect(strip.getByRole("link", { name: "Button", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const pager = page.getByRole("navigation", { name: "Previous and next page" });
  await expect(pager.getByRole("link")).toHaveCount(2);
  await pager.getByRole("link", { name: /Next/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).not.toHaveURL(/\/button\?/);
});

for (const scheme of SCHEMES)
  test(`the glass turns solid when more contrast is asked for, in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, contrast: "more" });
    await page.goto(`/?scheme=${scheme}&locale=en`);
    const bar = page.getByRole("banner");
    const { filter, alpha } = await bar.evaluate((element) => {
      const computed = getComputedStyle(element);
      // The fill's alpha, read off a canvas so any CSS colour form reads.
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no 2d canvas");
      context.fillStyle = computed.backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return { filter: computed.backdropFilter, alpha: context.getImageData(0, 0, 1, 1).data[3] };
    });
    expect(filter).toContain("blur(0px)");
    expect(alpha).toBe(255);
  });

for (const material of MaterialMode)
  for (const scheme of SCHEMES)
    test(`the index passes axe in the ${material} material, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/?scheme=${scheme}&locale=en&material=${material}`);
      await expect(page.locator("html")).toHaveAttribute("data-material", material);
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
      expect(incomplete.map((v) => v.id)).toEqual([]);
    });

// @covers sta-425:SC-001
for (const material of MaterialMode)
  for (const scheme of SCHEMES)
    test(`the Button page passes axe on the steel accent and glass buttons in ${material}, ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/button?scheme=${scheme}&locale=en&material=${material}`);
      await expect(page.locator(".button--secondary").first()).toBeVisible();
      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(AXE_TAGS)
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
      expect(incomplete.map((v) => v.id)).toEqual([]);
    });
