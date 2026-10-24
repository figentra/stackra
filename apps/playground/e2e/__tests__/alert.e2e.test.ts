/**
 * Stackra file contract:
 * Purpose: the alert route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left, also with the live alerts showing; each tone is announced as an alert or a
 *          status as its tone says and its title is painted in the tone's colour; every icon is 16 px, decorative and
 *          on the reading-start side; every action reaches 24 px; a failure inserted from the keyboard is an
 *          assertive alert, a retry replaces it with a polite status, and focus returns to the button that showed it.
 * Boundary: the production build under `vite preview`; Chromium only. React Aria hides everything outside an open
 *           overlay, and none opens here, so role queries work throughout.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0312 (decision 3); ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.4.1, 2.1.1, 2.5.8 and 4.1.3.
 */
// @covers sta-350:FR-116 sta-350:SC-002 sta-350:SC-010
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Each tone, the theme variable its title is painted in, and whether it is announced at once. */
const TONES = [
  { tone: "default", title: "Your trial is active", role: "foreground", isUrgent: false },
  {
    tone: "accent",
    title: "A new version is available",
    role: "accent-soft-foreground",
    isUrgent: false,
  },
  { tone: "success", title: "Changes saved", role: "success-soft-foreground", isUrgent: false },
  {
    tone: "warning",
    title: "Storage is almost full",
    role: "warning-soft-foreground",
    isUrgent: true,
  },
  { tone: "danger", title: "Payment failed", role: "danger-soft-foreground", isUrgent: true },
] as const;

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/alert?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Alert" })).toBeVisible();
};

/** The text colour an element paints as `#rrggbb`: drawn on a canvas, so any CSS colour form (oklch too) reads. */
const paintedColor = (locator: Locator) =>
  locator.evaluate((element) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(element).color;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });

/** The colour a theme variable paints as text, read from a probe element that is removed again. */
const paintedVariable = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.color = `var(--${variable})`;
    document.body.append(probe);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no 2d canvas");
    context.fillStyle = getComputedStyle(probe).color;
    probe.remove();
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }, name);

for (const scheme of SCHEMES)
  for (const locale of LOCALES) {
    test(`axe finds nothing on the alert page in ${scheme}, ${locale}`, async ({ page }) => {
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

    test(`axe finds nothing with the live alerts showing in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      const live = page.getByRole("region", { name: "Try it" });
      await live.getByRole("button", { name: "Show payment error" }).click();
      await live.getByRole("button", { name: "Show save confirmation" }).click();
      await expect(live.getByRole("alert")).toBeVisible();
      await expect(live.getByRole("status")).toBeVisible();
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
  }

test("each tone is announced as an alert or a status, as its tone says", async ({ page }) => {
  await open(page, "light", "en");
  const tones = page.getByRole("region", { name: "Tones" });
  await expect(tones.getByRole("alert")).toHaveCount(2);
  await expect(tones.getByRole("status")).toHaveCount(3);
  for (const { title, isUrgent } of TONES) {
    const alert = tones.locator('[data-slot="alert-root"]').filter({ hasText: title });
    await expect(alert).toHaveAttribute("role", isUrgent ? "alert" : "status");
    await expect(alert).toHaveAttribute("aria-live", isUrgent ? "assertive" : "polite");
  }
});

for (const scheme of SCHEMES)
  test(`each title is painted in its tone's colour in ${scheme}`, async ({ page }) => {
    await open(page, scheme, "en");
    const tones = page.getByRole("region", { name: "Tones" });
    for (const { title, role, tone } of TONES) {
      const painted = await paintedColor(
        tones.locator('[data-slot="alert-title"]').filter({ hasText: title }),
      );
      expect(painted, `${tone} in ${scheme}`).toBe(await paintedVariable(page, role));
    }
  });

test("every icon is 16 px and decorative, and an alert with icon false has none", async ({
  page,
}) => {
  await open(page, "light", "en");
  const indicators = page
    .getByRole("main")
    .locator('[data-slot="alert-root"]')
    .locator('[data-slot="alert-indicator"] svg');
  // Five tones, and three of the four parts: the fourth has no icon.
  await expect(indicators).toHaveCount(5 + 3);
  for (const icon of await indicators.all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    const box = await icon.boundingBox();
    if (!box) throw new Error("an icon has no box");
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([16, 16]);
  }
  const noIcon = page
    .getByRole("region", { name: "Parts" })
    .locator('[data-slot="alert-root"]')
    .filter({ hasText: "Payment failed" });
  await expect(noIcon.locator('[data-slot="alert-indicator"]')).toHaveCount(0);
});

for (const locale of LOCALES)
  test(`the icon sits on the reading-start side of the title in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const alert = page
      .getByRole("region", { name: "Tones" })
      .locator('[data-slot="alert-root"]')
      .first();
    const icon = await alert.locator('[data-slot="alert-indicator"]').boundingBox();
    const title = await alert.locator('[data-slot="alert-title"]').boundingBox();
    if (!icon || !title) throw new Error("a box is missing");
    expect(icon.x < title.x, locale).toBe(locale === "en");
  });

test("every action reaches 24 px and the actions sit under the description", async ({ page }) => {
  await open(page, "light", "en");
  const alert = page
    .getByRole("region", { name: "Parts" })
    .locator('[data-slot="alert-root"]')
    .filter({ hasText: "Storage is almost full" });
  const buttons = alert.getByRole("button");
  await expect(buttons).toHaveCount(2);
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    if (!box) throw new Error("a button has no box");
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
  const description = await alert.locator('[data-slot="alert-description"]').boundingBox();
  const actions = await alert.locator('[data-slot="alert-actions"]').boundingBox();
  if (!description || !actions) throw new Error("a box is missing");
  expect(actions.y).toBeGreaterThanOrEqual(description.y + description.height);
});

test("a failure from the keyboard is an assertive alert, a retry makes it a polite status and focus returns", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByRole("alert")).toHaveCount(0);
  await live.getByRole("button", { name: "Show payment error" }).focus();
  await page.keyboard.press("Enter");
  const error = live.getByRole("alert");
  await expect(error).toContainText("Payment failed");
  await expect(error).toHaveAttribute("aria-live", "assertive");

  await live.getByRole("button", { name: "Try again" }).focus();
  await page.keyboard.press("Enter");
  await expect(live.getByRole("alert")).toHaveCount(0);
  const saved = live.getByRole("status");
  await expect(saved).toContainText("Changes saved");
  await expect(saved).toHaveAttribute("aria-live", "polite");
  await expect(live.getByRole("button", { name: "Show save confirmation" })).toBeFocused();

  await live.getByRole("button", { name: "Dismiss" }).focus();
  await page.keyboard.press("Enter");
  await expect(live.getByRole("status")).toHaveCount(0);
  await expect(live.getByRole("button", { name: "Show save confirmation" })).toBeFocused();
});
