/**
 * Stackra file contract:
 * Purpose: proves the web Sidebar names its landmark, menu and toggle button from `label` (and the package's
 *          English toggle name without it), names the icon-only trigger of a collapsed item and the mobile sheet
 *          from `label`, draws HeroUI Pro's items, passes unknown props through, carries HeroUI Pro's own parts and
 *          hooks, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither and the sidebar reads the mobile breakpoint and its scroll box through them; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-005
import { Sidebar as HeroSidebar } from "@heroui-pro/react/sidebar";
import { fireEvent, render, screen } from "@testing-library/react";

import { Sidebar, useSidebar, useSidebarPages, type SidebarProps } from "#react/sidebar/sidebar";
import type { SidebarMenuProps } from "#react/sidebar/sidebar-menu";
import type { SidebarMenuIconProps } from "#react/sidebar/sidebar-menu-icon";
import type { SidebarMobileProps } from "#react/sidebar/sidebar-mobile";
import type { SidebarRailProps } from "#react/sidebar/sidebar-rail";
import type { SidebarTriggerProps } from "#react/sidebar/sidebar-trigger";

// jsdom has neither `matchMedia` nor `ResizeObserver`. HeroUI Pro's Sheet reads `matchMedia` as its module loads, so the
// stubs also exist before any import; the config restores stubbed globals after each test, so `beforeEach` stubs again.
function stubBrowserApis(matches = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
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
vi.hoisted(() => stubBrowserApis());

beforeEach(() => stubBrowserApis());

function Shell({
  label,
  rail,
  defaultOpen,
  iconLabel,
}: {
  label?: string;
  rail?: string;
  defaultOpen?: boolean;
  iconLabel?: string;
}) {
  return (
    <Sidebar.Provider {...(defaultOpen === undefined ? {} : { defaultOpen })}>
      <Sidebar {...(label ? { label } : {})} data-testid="sidebar">
        <Sidebar.Header>Brand</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
            <Sidebar.Menu label="Navigation">
              <Sidebar.MenuItem id="home" textValue="Home" href="#home" isCurrent>
                <Sidebar.MenuIcon {...(iconLabel ? { label: iconLabel } : {})}>i</Sidebar.MenuIcon>
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

/** The text of the first item's icon, which is where the collapsed item's hidden name goes. */
function iconText() {
  return screen.getByRole("row", { name: "Home" }).querySelector('[data-slot="sidebar-menu-icon"]')
    ?.textContent;
}

/** A button that opens the provider's mobile sheet. */
function OpenSheet() {
  const { setMobileOpen } = useSidebar();
  return (
    <button type="button" onClick={() => setMobileOpen(true)}>
      Open
    </button>
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

  it("names the rail with the package's English text when label is left out", () => {
    render(<Shell />);
    const rail = document.querySelector('[data-slot="sidebar-rail"]');
    expect(rail?.getAttribute("aria-label")).toBe("Collapse the sidebar");
  });

  it("draws HeroUI Pro's items, marks the current one, and passes unknown props through", () => {
    render(<Shell />);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("Workspace")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("row", { name: "Home" }).getAttribute("data-current")).toBe("true");
    expect(screen.getByRole("row", { name: "Reports" }).hasAttribute("data-current")).toBe(false);
  });

  it("carries HeroUI Pro's own parts and hooks, bar the two it names", () => {
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
      "MenuLabel",
      "MenuChip",
      "MenuActions",
      "MenuAction",
      "MenuTrigger",
      "MenuIndicator",
      "Submenu",
      "Tooltip",
      "Separator",
      "Pages",
      "Page",
      "Main",
    ] as const) {
      expect(Sidebar[part]).toBe(HeroSidebar[part]);
    }
    expect(typeof useSidebar).toBe("function");
    expect(typeof useSidebarPages).toBe("function");
  });

  it("adds the icon's label as hidden text while collapsed to icons, and nothing while expanded", () => {
    // jsdom draws no tooltip trigger, so this reads the text HeroUI Pro's trigger takes its name from: the icon's own.
    const { unmount } = render(<Shell defaultOpen={false} iconLabel="Home" />);
    expect(iconText()).toBe("iHome");
    unmount();

    render(<Shell defaultOpen iconLabel="Home" />);
    expect(iconText()).toBe("i");
  });

  it("leaves the icon alone when it has no label", () => {
    render(<Shell defaultOpen={false} />);
    expect(iconText()).toBe("i");
  });

  it("names the mobile navigation sheet from label", () => {
    stubBrowserApis(true);
    // The provider closes the sheet as it reads the breakpoint on mount, so the sheet opens after it, from a press.
    render(
      <Sidebar.Provider>
        <OpenSheet />
        <Sidebar.Mobile label="Site navigation" data-testid="mobile">
          <Sidebar.Content>Links</Sidebar.Content>
        </Sidebar.Mobile>
      </Sidebar.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Site navigation" })).toBeTruthy();
    expect(screen.getByTestId("mobile")).toBeTruthy();
    expect(screen.getByText("Links")).toBeTruthy();
  });

  it("drops HeroUI Pro's off-screen sheet fill with a rule scoped to the sidebar sheet", () => {
    stubBrowserApis(true);
    render(
      <Sidebar.Provider>
        <OpenSheet />
        <Sidebar.Mobile label="Site navigation">x</Sidebar.Mobile>
      </Sidebar.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const rule = screen.getByRole("dialog").querySelector("style")?.textContent;
    expect(rule).toContain(".sidebar__mobile-sheet[data-sheet-drawer]");
    expect(rule).toContain("::after{content:none}");
  });

  it("types the accessible name as label", () => {
    expectTypeOf<SidebarProps>().toHaveProperty("label");
    expectTypeOf<SidebarMobileProps>().toHaveProperty("label");
    expectTypeOf<SidebarMenuIconProps>().toHaveProperty("label");
    // @ts-expect-error `label` is required: HeroUI Pro leaves the sheet dialog unnamed
    void (<Sidebar.Mobile>x</Sidebar.Mobile>);
    expectTypeOf<SidebarMenuProps<object>>().toHaveProperty("label");
    expectTypeOf<SidebarTriggerProps>().toHaveProperty("label");
    expectTypeOf<SidebarRailProps>().toHaveProperty("label");
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Sidebar.Menu aria-label="x">{[]}</Sidebar.Menu>);
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Sidebar.Trigger aria-label="x" />);
  });
});
