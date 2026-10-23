/**
 * Stackra file contract:
 * Purpose: proves the web Sidebar names its landmark, menu and toggle button from `label` (and keeps HeroUI Pro's
 *          default toggle name without it), draws HeroUI Pro's items, passes unknown props through, carries
 *          HeroUI Pro's own parts and hooks, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither and the sidebar reads the mobile breakpoint and its scroll box through them; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-005
import { Sidebar as HeroSidebar } from "@heroui-pro/react/sidebar";
import { render, screen } from "@testing-library/react";

import { Sidebar, useSidebar, useSidebarPages, type SidebarProps } from "#react/sidebar/sidebar";
import type { SidebarMenuProps } from "#react/sidebar/sidebar-menu";
import type { SidebarRailProps } from "#react/sidebar/sidebar-rail";
import type { SidebarTriggerProps } from "#react/sidebar/sidebar-trigger";

// jsdom has neither `matchMedia` nor `ResizeObserver`. HeroUI Pro's Sheet reads `matchMedia` as its module loads, so the
// stubs also exist before any import; the config restores stubbed globals after each test, so `beforeEach` stubs again.
function stubBrowserApis() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}
vi.hoisted(stubBrowserApis);

beforeEach(stubBrowserApis);

function Shell({ label, rail }: { label?: string; rail?: string }) {
  return (
    <Sidebar.Provider>
      <Sidebar {...(label ? { label } : {})} data-testid="sidebar">
        <Sidebar.Header>Brand</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
            <Sidebar.Menu label="Navigation">
              <Sidebar.MenuItem id="home" textValue="Home" href="#home" isCurrent>
                <Sidebar.MenuIcon>i</Sidebar.MenuIcon>
                <Sidebar.MenuLabel>Home</Sidebar.MenuLabel>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem id="reports" textValue="Reports" href="#reports">
                <Sidebar.MenuLabel>Reports</Sidebar.MenuLabel>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>Footer</Sidebar.Footer>
        <Sidebar.Rail {...(rail ? { label: rail } : {})} />
      </Sidebar>
      <Sidebar.Trigger label="Collapse the sidebar" />
    </Sidebar.Provider>
  );
}

describe("Sidebar (web)", () => {
  beforeEach(() => {});
  afterEach(() => vi.unstubAllGlobals());

  it("takes the names of its landmark, menu, toggle button and rail from label", () => {
    render(<Shell label="Main navigation" rail="Resize the sidebar" />);
    expect(screen.getByRole("complementary", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse the sidebar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resize the sidebar", hidden: true })).toBeTruthy();
  });

  it("keeps HeroUI Pro's default rail name when label is left out", () => {
    render(<Shell />);
    expect(screen.getByRole("button", { name: "Toggle sidebar", hidden: true })).toBeTruthy();
  });

  it("draws HeroUI Pro's items, marks the current one, and passes unknown props through", () => {
    render(<Shell />);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("Workspace")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("row", { name: "Home" }).getAttribute("data-current")).toBe("true");
    expect(screen.getByRole("row", { name: "Reports" }).hasAttribute("data-current")).toBe(false);
  });

  it("carries HeroUI Pro's own parts and hooks", () => {
    for (const part of [
      "Provider",
      "Header",
      "Content",
      "Footer",
      "Group",
      "GroupLabel",
      "MenuSection",
      "MenuHeader",
      "MenuItem",
      "MenuItemContent",
      "MenuIcon",
      "MenuLabel",
      "MenuChip",
      "MenuActions",
      "MenuAction",
      "MenuTrigger",
      "MenuIndicator",
      "Submenu",
      "Tooltip",
      "Separator",
      "Mobile",
      "Pages",
      "Page",
      "Main",
    ] as const) {
      expect(Sidebar[part]).toBe(HeroSidebar[part]);
    }
    expect(typeof useSidebar).toBe("function");
    expect(typeof useSidebarPages).toBe("function");
  });

  it("types the accessible name as label", () => {
    expectTypeOf<SidebarProps>().toHaveProperty("label");
    expectTypeOf<SidebarMenuProps<object>>().toHaveProperty("label");
    expectTypeOf<SidebarTriggerProps>().toHaveProperty("label");
    expectTypeOf<SidebarRailProps>().toHaveProperty("label");
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Sidebar.Menu aria-label="x">{[]}</Sidebar.Menu>);
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Sidebar.Trigger aria-label="x" />);
  });
});
