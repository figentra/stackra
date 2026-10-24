/**
 * Stackra file contract:
 * Purpose: the entity picker route's own end-to-end checks: axe finds nothing (violations or incomplete) in light,
 *          dark, left-to-right and right-to-left, nor on an open list; each field is named by its label and the
 *          description and error are tied to it; a record is found by typing and picked from the keyboard alone; several
 *          records are tags whose buttons say whom they remove; the slow server's spinner is named and the failing
 *          server's message is announced beside the list; the create-new row picks the record it makes; a disabled field
 *          cannot be focused and a read-only one cannot be typed in; and the live pickers report what they hold.
 * Boundary: the production build under `vite preview`; Chromium only.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0318; ADR 0182 (test tiers); ADR 0022 (test placement);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2, 4.1.3.
 */
// @covers sta-350:FR-201 sta-350:SC-002
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/entity-picker?scheme=${scheme}&locale=${locale}`);
  await expect(page.getByRole("heading", { level: 1, name: "Entity picker" })).toBeVisible();
};

/** Runs axe on the page and expects nothing, neither a violation nor a check left for review. */
const expectNoAxeFindings = async (page: Page) => {
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
    test(`axe finds nothing on the entity picker page in ${scheme}, ${locale}`, async ({
      page,
    }) => {
      await open(page, scheme, locale);
      await expectNoAxeFindings(page);
    });

test("axe finds nothing with a list of people open", async ({ page }) => {
  await open(page, "light", "en");
  await page
    .getByRole("region", { name: "Basics" })
    .getByRole("combobox", { name: "Owner" })
    .focus();
  await expect(page.getByRole("option", { name: /Ada Lovelace/ })).toBeVisible();
  await expectNoAxeFindings(page);
});

test("each field is named, and the description and the error are tied to its input", async ({
  page,
}) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Basics" });
  await expect(basics.getByRole("combobox", { name: "Team" })).toBeVisible();
  await expect(basics.getByRole("combobox", { name: /Reviewer/ })).toHaveAccessibleDescription(
    "The person who signs the change off.",
  );
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("combobox", { name: /Invalid/ })).toHaveAccessibleDescription(
    "Choose an owner before you continue.",
  );
});

test("a record is found by typing and picked from the keyboard alone", async ({ page }) => {
  await open(page, "light", "en");
  const input = page
    .getByRole("region", { name: "Basics" })
    .getByRole("combobox", { name: "Owner" });
  await input.focus();
  await page.keyboard.type("hop");
  await expect(page.getByRole("option")).toHaveText([/Grace Hopper/]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toHaveValue("Grace Hopper");
  await expect(input).toBeFocused();
});

test("several records are tags whose buttons say whom they remove", async ({ page }) => {
  await open(page, "light", "en");
  const several = page.getByRole("region", { name: "Several records" });
  // CSS, not `getByRole`: while the list is open React Aria hides the rest of the page from the accessibility tree.
  const tags = several.locator('[role="grid"][aria-label="Reviewers"] [data-slot="tag"]');
  await expect(tags).toHaveCount(2);
  await several.getByRole("button", { name: "Remove Ada Lovelace" }).click();
  await expect(tags).toHaveCount(1);

  await several.getByRole("combobox", { name: "Reviewers" }).focus();
  await page.keyboard.type("lisk");
  await page.getByRole("option", { name: /Barbara Liskov/ }).click();
  await expect(tags).toHaveCount(2);
  await expect(tags.last()).toContainText("Barbara Liskov");
});

test("the slow server's spinner is named, and the failing server's message is announced", async ({
  page,
}) => {
  await open(page, "light", "en");
  const server = page.getByRole("region", { name: "A slow or failing server" });
  await server.getByRole("combobox", { name: /slow server/ }).focus();
  await expect(page.getByRole("status", { name: "Loading people" })).toBeVisible();
  await expect(page.getByRole("option", { name: /Ada Lovelace/ })).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");

  await server.getByRole("combobox", { name: /offline/ }).focus();
  const failed = page.getByRole("status").filter({ hasText: "People could not be loaded." });
  await expect(failed).toBeVisible();
  await expect(page.getByRole("listbox").getByText("People could not be loaded.")).toHaveCount(0);
});

test("the create-new row adds the typed name and picks it", async ({ page }) => {
  await open(page, "light", "en");
  const input = page
    .getByRole("region", { name: "Create a record" })
    .getByRole("combobox", { name: "Assignee" });
  await input.focus();
  await page.keyboard.type("Mary Jackson");
  await page.getByRole("option", { name: "Add “Mary Jackson”" }).click();
  await expect(input).toHaveValue("Mary Jackson");
});

test("a disabled field cannot be focused, and a read-only one cannot be typed in", async ({
  page,
}) => {
  await open(page, "light", "en");
  const states = page.getByRole("region", { name: "States" });
  await expect(states.getByRole("combobox", { name: "Disabled" })).toBeDisabled();
  const readOnly = states.getByRole("combobox", { name: "Read-only" });
  await readOnly.focus();
  await page.keyboard.type("x");
  await expect(readOnly).toHaveValue("");
  await expect(states.getByRole("button", { name: /Remove/ })).toHaveCount(0);
});

test("the live pickers report the owner and the followers", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("entity-picker-owner")).toHaveText("Owner: none");
  await live.getByRole("combobox", { name: "Owner" }).focus();
  await page.keyboard.type("turing");
  await page.getByRole("option", { name: /Alan Turing/ }).click();
  await expect(live.getByTestId("entity-picker-owner")).toHaveText("Owner: Alan Turing");

  await live.getByRole("combobox", { name: "Followers" }).focus();
  await page.keyboard.type("knuth");
  await page.getByRole("option", { name: /Donald Knuth/ }).click();
  await expect(live.getByTestId("entity-picker-followers")).toHaveText("Followers: Donald Knuth");
});
