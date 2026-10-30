/**
 * Stackra file contract:
 * Purpose: the number-field route's own end-to-end checks: axe finds nothing (violations or incomplete) in light, dark,
 *          left-to-right and right-to-left; each input is named by its label and described by its description; the two
 *          buttons are named and at least 24 pixels square; the buttons, the arrow keys, Home and End step the value and a
 *          typed value is moved to the nearest bound; a percentage and a currency are written in the language of the page;
 *          a field without buttons is still stepped by the arrow keys; an invalid field is marked and read with its error;
 *          a disabled field is switched off and a read-only one keeps focus but refuses every change; the live field
 *          shows the number it holds; the focus shows a ring; and the label and the buttons sit at the reading-start and
 *          reading-end sides in both directions.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0182 (test tiers); ADR 0022
 *          (test placement); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.8, 4.1.2.
 */
// @covers sta-350:FR-204 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";
import { example } from "../support/example.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/number-field?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Number field", locale) }),
  ).toBeVisible();
};

/** The whole field (label, group and messages) whose label contains this text. */
const fieldOf = (page: Page, label: string) =>
  // The examples only: the Stackra section draws the usage demo again, hidden.
  page.locator("#usage, #examples").locator('[data-slot="number-field"]', { hasText: label });

/** The demo's words in the page's language (`assets/lang/<locale>/number_field.json`, the field's own buttons). */
const WORDS = {
  en: {
    quantity: "Quantity",
    discount: "Discount",
    price: "Price",
    decrease: "Decrease",
    increase: "Increase",
  },
  ar: {
    quantity: "الكمية",
    discount: "الخصم",
    price: "السعر",
    decrease: "إنقاص",
    increase: "زيادة",
  },
} as const;

/** The input of the field whose label contains this text. */
const inputOf = (page: Page, label: string) => fieldOf(page, label).getByRole("textbox");

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("a box is missing");
  return box;
};

for (const scheme of SCHEMES)
  for (const locale of LOCALES)
    test(`axe finds nothing on the number field page in ${scheme}, ${locale}`, async ({ page }) => {
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

test("each input is named by its label and described by its description", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "Quantity" });
  await expect(input).toBeVisible();
  await expect(input).toHaveAccessibleDescription("Type a number or step it with the buttons.");
  await expect(inputOf(page, "Seats, 1 to 10")).toHaveAccessibleName("Seats, 1 to 10");
  await expect(inputOf(page, "Discount")).toHaveAccessibleDescription(
    "Held as a fraction, shown as a percentage.",
  );
});

test("the buttons are named and at least 24 pixels square", async ({ page }) => {
  await open(page, "light", "en");
  for (const name of ["Decrease", "Increase"]) {
    const button = fieldOf(page, "Quantity").getByRole("button", { name });
    await expect(button).toBeVisible();
    const box = await boxOf(button);
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(24);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(24);
  }
});

test("the buttons step the value", async ({ page }) => {
  await open(page, "light", "en");
  const input = inputOf(page, "Quantity");
  await expect(input).toHaveValue("2");
  await fieldOf(page, "Quantity").getByRole("button", { name: "Increase" }).click();
  await fieldOf(page, "Quantity").getByRole("button", { name: "Increase" }).click();
  await expect(input).toHaveValue("4");
  await fieldOf(page, "Quantity").getByRole("button", { name: "Decrease" }).click();
  await expect(input).toHaveValue("3");
});

test("the arrow keys, Home and End step the value within its bounds", async ({ page }) => {
  await open(page, "light", "en");
  const input = inputOf(page, "Seats, 1 to 10");
  await input.focus();
  await expect(input).toHaveValue("4");
  await page.keyboard.press("ArrowUp");
  await expect(input).toHaveValue("5");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(input).toHaveValue("3");
  await page.keyboard.press("End");
  await expect(input).toHaveValue("10");
  await page.keyboard.press("ArrowUp");
  await expect(input).toHaveValue("10");
  await expect(
    fieldOf(page, "Seats, 1 to 10").getByRole("button", { name: "Increase" }),
  ).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(input).toHaveValue("1");
  await expect(
    fieldOf(page, "Seats, 1 to 10").getByRole("button", { name: "Decrease" }),
  ).toBeDisabled();
});

test("a typed value is moved to the nearest bound when the field loses focus", async ({ page }) => {
  await open(page, "light", "en");
  const input = inputOf(page, "Seats, 1 to 10");
  await input.fill("40");
  await page.keyboard.press("Tab");
  await expect(input).toHaveValue("10");
  await input.fill("0");
  await page.keyboard.press("Tab");
  await expect(input).toHaveValue("1");
});

test("a percentage and a currency are written by their format and stepped by their step", async ({
  page,
}) => {
  await open(page, "light", "en");
  const percent = inputOf(page, "Discount");
  const price = inputOf(page, "Price");
  await expect(percent).toHaveValue("15%");
  await expect(price).toHaveValue("$1,299.50");
  await percent.focus();
  await page.keyboard.press("ArrowUp");
  await expect(percent).toHaveValue("20%");
  await price.focus();
  await page.keyboard.press("ArrowUp");
  await expect(price).toHaveValue("$1,300.00");
});

test("the language of the page changes how a number is written", async ({ page }) => {
  await open(page, "light", "ar");
  await expect(inputOf(page, WORDS.ar.discount)).not.toHaveValue("15%");
  await expect(inputOf(page, WORDS.ar.price)).not.toHaveValue("$1,299.50");
});

test("a field without buttons has none and is still stepped by the arrow keys", async ({
  page,
}) => {
  await open(page, "light", "en");
  const field = fieldOf(page, "Years of experience");
  await expect(field.getByRole("button")).toHaveCount(0);
  const input = field.getByRole("textbox");
  await input.focus();
  await page.keyboard.press("ArrowUp");
  await expect(input).toHaveValue("4");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(input).toHaveValue("2");
});

test("an invalid field is marked invalid and read with its error", async ({ page }) => {
  await open(page, "light", "en");
  const input = page.getByRole("textbox", { name: "Guests" });
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter at least one guest.")).toBeVisible();
  await expect(input).toHaveAccessibleDescription("Enter at least one guest.");
});

test("a disabled field is switched off, with its buttons", async ({ page }) => {
  await open(page, "light", "en");
  const field = fieldOf(page, "Rooms");
  await expect(field.getByRole("textbox")).toBeDisabled();
  await expect(field.getByRole("button", { name: "Increase" })).toBeDisabled();
  await expect(field.getByRole("button", { name: "Decrease" })).toBeDisabled();
});

test("a read-only field keeps focus but refuses every change", async ({ page }) => {
  await open(page, "light", "en");
  const field = fieldOf(page, "Floors");
  const input = field.getByRole("textbox");
  await expect(input).toHaveJSProperty("readOnly", true);
  await input.focus();
  await expect(input).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("End");
  await page.keyboard.type("9");
  await expect(input).toHaveValue("5");
  await expect(field.getByRole("button", { name: "Increase" })).toBeDisabled();
});

test("the live field shows the number it holds, steps it, moves typed text to its bounds and shows empty", async ({
  page,
}) => {
  await open(page, "light", "en");
  const live = example(page, "live");
  const input = live.getByRole("textbox", { name: "Seats to book" });
  const echo = live.getByTestId("number-field-value");
  await expect(echo).toHaveText("4 seats chosen.");
  await live.getByRole("button", { name: "Increase" }).click();
  await expect(echo).toHaveText("5 seats chosen.");
  await input.fill("40");
  await page.keyboard.press("Tab");
  await expect(echo).toHaveText("10 seats chosen.");
  await input.fill("1");
  await page.keyboard.press("Tab");
  await expect(echo).toHaveText("1 seat chosen.");
  await input.fill("");
  await page.keyboard.press("Tab");
  await expect(echo).toHaveText("No seats chosen yet.");
  await expect(input).toHaveValue("");
});

test("the focused field shows a ring", async ({ page }) => {
  await open(page, "light", "en");
  await inputOf(page, "Quantity").focus();
  const group = fieldOf(page, "Quantity").locator('[data-slot="number-field-group"]');
  const ring = await group.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      style.boxShadow !== "none" ||
      (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0)
    );
  });
  expect(ring).toBe(true);
});

for (const locale of LOCALES) {
  test(`the label sits at the reading-start side of the field in ${locale}`, async ({ page }) => {
    await open(page, "light", locale);
    const field = fieldOf(page, WORDS[locale].quantity);
    const label = await boxOf(field.locator('[data-slot="label"]'));
    const group = await boxOf(field.locator('[data-slot="number-field-group"]'));
    if (locale === "en") expect(label.x).toBeCloseTo(group.x, 0);
    else expect(label.x + label.width).toBeCloseTo(group.x + group.width, 0);
  });

  test(`the decrease button sits at the reading-start side and the increase button at the end in ${locale}`, async ({
    page,
  }) => {
    await open(page, "light", locale);
    const field = fieldOf(page, WORDS[locale].quantity);
    const decrease = await boxOf(field.getByRole("button", { name: WORDS[locale].decrease }));
    const input = await boxOf(field.getByRole("textbox"));
    const increase = await boxOf(field.getByRole("button", { name: WORDS[locale].increase }));
    if (locale === "en") {
      expect(decrease.x + decrease.width).toBeLessThanOrEqual(input.x + 1);
      expect(increase.x).toBeGreaterThanOrEqual(input.x + input.width - 1);
    } else {
      expect(decrease.x).toBeGreaterThanOrEqual(input.x + input.width - 1);
      expect(increase.x + increase.width).toBeLessThanOrEqual(input.x + 1);
    }
  });
}
