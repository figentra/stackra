/**
 * Stackra file contract:
 * Purpose: proves the action-menu page titles the document, shows its sections and one named button per variant and
 *          size, opens the basics menu with grouped actions, leaves the disabled button unopenable, and that on the live
 *          row a press on the row opens it while a press on the menu button or on an action never does.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-109
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { ActionMenu } from "#src/routes/action-menu/action-menu";
import { ActionMenuRoute } from "#src/routes/action-menu/action-menu.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <ActionMenu />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Action menu page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /action-menu under Overlays", () => {
    renderPage();
    expect(ActionMenuRoute.path).toBe("/action-menu");
    expect(ActionMenuRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Action menu" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Action menu · Stackra Playground");
  });

  it("shows every section and one named button for each variant in each size", () => {
    renderPage();
    for (const name of ["Basics", "Variants and sizes", "Icon", "Placement", "States", "Try it"])
      expect(screen.getByRole("region", { name })).toBeTruthy();
    // Three sizes of seven variants.
    expect(section("Variants and sizes").getAllByRole("button")).toHaveLength(21);
    expect(
      section("Variants and sizes").getByRole("button", { name: "Actions, ghost, md" }),
    ).toBeTruthy();
  });

  it("opens the basics menu with grouped actions and a disabled one that says why", () => {
    renderPage();
    press(section("Basics").getByRole("button", { name: "Actions for order 1001" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("group")).toHaveLength(2);
    expect(within(menu).getByRole("menuitem", { name: /^Delete/ })).toBeTruthy();
    expect(
      within(within(menu).getByRole("menuitem", { name: /^Archive/ })).getByText(
        "Paid orders cannot be archived",
      ),
    ).toBeTruthy();
  });

  it("leaves the disabled button unopenable", () => {
    renderPage();
    const disabled = section("States").getByRole<HTMLButtonElement>("button", {
      name: "Actions, unavailable",
    });
    expect(disabled.disabled).toBe(true);
    press(disabled);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the row from a press on it, never from the menu button or an action in the menu", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Row opened 0 times.")).toBeTruthy();
    press(live.getByText("Order 1001"));
    expect(live.getByText("Row opened 1 time.")).toBeTruthy();
    press(live.getByRole("button", { name: "Open order" }));
    expect(live.getByText("Row opened 2 times.")).toBeTruthy();

    press(live.getByRole("button", { name: "Actions for order 1001" }));
    press(screen.getByRole("menuitem", { name: /^Duplicate/ }));
    expect(live.getByText("Last action: duplicate")).toBeTruthy();
    expect(live.getByText("Row opened 2 times.")).toBeTruthy();
  });
});
