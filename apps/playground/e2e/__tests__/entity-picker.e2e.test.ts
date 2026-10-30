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
import { expect, test, type Locator, type Page } from "@playwright/test";
import { pageTitle } from "../support/page-title.function";

const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "ar"] as const;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const open = async (page: Page, scheme: string, locale: string) => {
  await page.emulateMedia({ colorScheme: scheme as "light" | "dark", reducedMotion: "reduce" });
  await page.goto(`/entity-picker?scheme=${scheme}&locale=${locale}`);
  await expect(
    page.getByRole("heading", { level: 1, name: pageTitle("Entity picker", locale) }),
  ).toBeVisible();
};

/**
 * Centres an element in the window, then focuses it. React Aria closes an open list or menu on a scroll, and a field
 * at the window's edge, where focus alone would leave it, scrolls once its list opens below it.
 */
const focusInView = async (locator: Locator) => {
  await locator.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await locator.focus();
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
  await focusInView(
    page.getByRole("region", { name: "Usage" }).getByRole("combobox", { name: "Owner" }),
  );
  await expect(page.getByRole("option", { name: /Ada Lovelace/ })).toBeVisible();
  // Scoped to the list's popover. The page stays visible: hiding it would blur the input, which closes the list.
  const { violations, incomplete } = await new AxeBuilder({ page })
    .include('[data-slot="combo-box-popover"]')
    .withTags(AXE_TAGS)
    // React Aria names an option by its label and describes it by its second line; this experimental rule reads the
    // second line and the avatar's initials as label text. The list is driven from the input through
    // aria-activedescendant, so its scroll region is reached by the arrow keys and is never a Tab stop.
    .disableRules(["label-content-name-mismatch", "scrollable-region-focusable"])
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

test("each field is named, and the description and the error are tied to its input", async ({
  page,
}) => {
  await open(page, "light", "en");
  const basics = page.getByRole("region", { name: "Usage" });
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
    .getByRole("region", { name: "Usage" })
    .getByRole("combobox", { name: "Owner" });
  await focusInView(input);
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

  await focusInView(several.getByRole("combobox", { name: "Reviewers" }));
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
  await focusInView(server.getByRole("combobox", { name: /slow server/ }));
  await expect(page.getByRole("status", { name: "Loading people" })).toBeVisible();
  await expect(page.getByRole("option", { name: /Ada Lovelace/ })).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(page.locator(".combo-box__popover")).toHaveCount(0);

  // From its button: focus moved straight from a list that just closed does not open the next one in React Aria.
  await server.getByRole("button", { name: /offline server/ }).click();
  const failed = page.getByRole("status").filter({ hasText: "People could not be loaded." });
  await expect(failed).toBeVisible();
  await expect(page.getByRole("listbox").getByText("People could not be loaded.")).toHaveCount(0);
});

test("the create-new row adds the typed name and picks it", async ({ page }) => {
  await open(page, "light", "en");
  const input = page
    .getByRole("region", { name: "Create a record" })
    .getByRole("combobox", { name: "Assignee" });
  await focusInView(input);
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
  await focusInView(readOnly);
  await page.keyboard.type("x");
  await expect(readOnly).toHaveValue("");
  await expect(states.getByRole("button", { name: /Remove/ })).toHaveCount(0);
});

test("the live pickers report the owner and the followers", async ({ page }) => {
  await open(page, "light", "en");
  const live = page.getByRole("region", { name: "Try it" });
  await expect(live.getByTestId("entity-picker-owner")).toHaveText("Owner: none");
  await focusInView(live.getByRole("combobox", { name: "Owner" }));
  await page.keyboard.type("turing");
  await page.getByRole("option", { name: /Alan Turing/ }).click();
  await expect(live.getByTestId("entity-picker-owner")).toHaveText("Owner: Alan Turing");

  await focusInView(live.getByRole("combobox", { name: "Followers" }));
  await page.keyboard.type("knuth");
  await page.getByRole("option", { name: /Donald Knuth/ }).click();
  await expect(live.getByTestId("entity-picker-followers")).toHaveText("Followers: Donald Knuth");
});
