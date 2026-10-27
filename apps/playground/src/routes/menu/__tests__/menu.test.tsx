/**
 * Stackra file contract:
 * Purpose: proves the menu page titles the document, shows its sections, opens the basics menu with its groups, a
 *          danger action and a disabled one that says why, offers every side and alignment, reports a single and a
 *          multiple selection scoped to a group, and reports a live menu's last action and open state, which can be
 *          opened from outside.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-109
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, waitFor, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Menu } from "#src/routes/menu/menu";
import { MenuRoute } from "#src/routes/menu/menu.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Menu />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Menu page", () => {
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

  it("titles the page and the document, and sits at /menu under Overlays", () => {
    renderPage();
    expect(routePath(MenuRoute)).toBe("/menu");
    expect(MenuRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Menu" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Menu · Stackra Playground");
  });

  it("shows every section", () => {
    renderPage();
    for (const name of ["Basics", "Placement", "Selection", "Submenu", "States", "Try it"])
      expect(screen.getByRole("region", { name })).toBeTruthy();
  });

  it("opens the basics menu with its groups, a danger action and a disabled one with its reason", () => {
    renderPage();
    press(section("Basics").getByRole("button", { name: "Order actions" }));
    const menu = screen.getByRole("menu", { name: "Order actions" });
    expect(within(menu).getByRole("group", { name: "Edit" })).toBeTruthy();
    expect(within(menu).getByRole("group", { name: "Danger zone" })).toBeTruthy();
    expect(
      within(menu)
        .getByRole("menuitem", { name: /^Delete/ })
        .classList.contains("menu-item--danger"),
    ).toBe(true);
    const archive = within(menu).getByRole("menuitem", { name: /^Archive/ });
    expect(archive.getAttribute("aria-disabled")).toBe("true");
    expect(within(archive).getByText("Paid orders cannot be archived")).toBeTruthy();
  });

  it("offers every side and alignment", () => {
    renderPage();
    const placement = section("Placement");
    for (const side of ["top", "bottom", "start", "end"])
      expect(placement.getByRole("button", { name: `Side ${side}` })).toBeTruthy();
    for (const align of ["start", "center", "end"])
      expect(placement.getByRole("button", { name: `Align ${align}` })).toBeTruthy();
  });

  it("reports a single choice per group and several choices in one", () => {
    renderPage();
    const selection = section("Selection");
    expect(selection.getByText("Chosen: desc, date")).toBeTruthy();
    press(selection.getByRole("button", { name: "Sort orders" }));
    press(screen.getByRole("menuitemradio", { name: "Ascending" }));
    // The order group's choice is replaced; the sort-by group's stays.
    expect(selection.getByText("Chosen: date, asc")).toBeTruthy();

    press(selection.getByRole("button", { name: "Columns" }));
    press(screen.getByRole("menuitemcheckbox", { name: "Total" }));
    expect(selection.getByText("Chosen: id, customer, total")).toBeTruthy();
  });

  it("reports the last action, and the open state which the page can set from outside", async () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Last action: none")).toBeTruthy();
    expect(live.getByText("The menu is closed.")).toBeTruthy();
    press(live.getByRole("button", { name: "Open the menu" }));
    expect(live.getByText("The menu is open.")).toBeTruthy();
    press(screen.getByRole("menuitem", { name: /^Rename/ }));
    expect(live.getByText("Last action: rename")).toBeTruthy();
    await waitFor(() => expect(live.getByText("The menu is closed.")).toBeTruthy());
  });
});
