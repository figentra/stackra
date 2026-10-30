/**
 * Stackra file contract:
 * Purpose: proves the web Sidebar: it stacks its start content, navigation and end content; names its one `nav`
 *          landmark; marks the active place (`aria-current="page"`, an ancestor `true`) and opens the sub-menu holding
 *          it; collapses and expands from its toggle (uncontrolled, from `defaultCollapsed`, controlled, or kept under
 *          `storageKey`) and from Cmd/Ctrl+B (not while typing, not when turned off); draws the rail with a rule for a
 *          group heading, the active entry lit and a badge as a dot; moves focus with the arrow keys, Home and End;
 *          slides away (`offcanvas`) inert, handing focus to the trigger outside; filters from its search box; shows
 *          loading rows; resizes from its rail by keyboard; and turns into a drawer below the mobile breakpoint.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes, styles and attributes are
 *           checked, not looks. `useBreakpoint` is replaced to choose the window width.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1 and 4); ADR 0022 (test
 *          placement); owner request 2026-10-29 (STA-1371).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-158
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { Sidebar } from "#react/sidebar/sidebar";
import { SidebarProvider } from "#react/sidebar/sidebar-provider";

const screenSize: { current: BreakpointState } = {
  current: { breakpoint: "xl", sizeClass: "desktop" },
};
vi.mock("#react/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => screenSize.current,
}));

const ITEMS: readonly NavigationItem[] = [
  // Icons the ui registry carries itself, so they draw without an app registry.
  { id: "home", label: "Home", href: "/", icon: "copy" },
  { id: "orders", label: "Orders", href: "/orders", icon: "check", isCurrent: true, badge: 3 },
  {
    id: "settings",
    label: "Settings",
    children: [
      { id: "profile", label: "Profile", href: "/profile" },
      { id: "billing", label: "Billing", href: "/billing" },
    ],
  },
];

const NESTED: readonly NavigationItem[] = [
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    children: [{ id: "sales", label: "Sales", href: "/reports/sales", isCurrent: true }],
  },
];

const press = (element: HTMLElement) => act(() => element.click());
const shortcut = (init: KeyboardEventInit, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
  });

beforeEach(() => {
  screenSize.current = { breakpoint: "xl", sizeClass: "desktop" };
  window.localStorage.clear();
});

describe("Sidebar (web)", () => {
  it("stacks the start content, the navigation and the end content in order", () => {
    render(
      <Sidebar
        items={ITEMS}
        startContent={<p>Acme</p>}
        endContent={<p>Ada</p>}
        data-testid="sidebar"
      />,
    );
    const text = screen.getByTestId("sidebar").textContent ?? "";
    expect(text.indexOf("Acme")).toBeLessThan(text.indexOf("Home"));
    expect(text.indexOf("Orders")).toBeLessThan(text.indexOf("Ada"));
  });

  it("holds one navigation landmark, named by `label`", () => {
    render(<Sidebar items={ITEMS} label="Main navigation" />);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  });

  it("marks the active place, and its ancestor, and opens the sub-menu that holds it", () => {
    render(<Sidebar items={[...ITEMS.slice(0, 2), ...NESTED]} />);
    expect(screen.getByRole("link", { name: /Orders/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Reports" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("link", { name: "Sales" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Pages under Reports" }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("names a group by its heading", () => {
    render(<Sidebar items={ITEMS} />);
    const group = screen.getByRole("group", { name: "Settings" });
    expect(within(group).getByRole("link", { name: "Billing" })).toBeTruthy();
  });

  it("collapses and expands from its own toggle, reporting each change", () => {
    const onCollapsedChange = vi.fn();
    render(<Sidebar items={ITEMS} onCollapsedChange={onCollapsedChange} data-testid="sidebar" />);
    const root = screen.getByTestId("sidebar");
    expect(root.getAttribute("data-state")).toBe("expanded");
    expect(root.style.width).toBe("256px");
    press(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(root.getAttribute("data-collapsed")).toBe("true");
    expect(root.style.width).toBe("64px");
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    press(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(root.hasAttribute("data-collapsed")).toBe(false);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps focus on the toggle when it collapses the sidebar", () => {
    render(<Sidebar items={ITEMS} />);
    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    act(() => toggle.focus());
    press(toggle);
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute("aria-label")).toBe("Expand sidebar");
  });

  it("starts collapsed with defaultCollapsed", () => {
    render(<Sidebar items={ITEMS} defaultCollapsed data-testid="sidebar" />);
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeTruthy();
  });

  it("follows isCollapsed when controlled, and only reports a press of the toggle", () => {
    const onCollapsedChange = vi.fn();
    const { rerender } = render(
      <Sidebar
        items={ITEMS}
        isCollapsed
        onCollapsedChange={onCollapsedChange}
        data-testid="sidebar"
      />,
    );
    const root = screen.getByTestId("sidebar");
    press(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(root.getAttribute("data-collapsed")).toBe("true");
    rerender(<Sidebar items={ITEMS} isCollapsed={false} data-testid="sidebar" />);
    expect(root.hasAttribute("data-collapsed")).toBe(false);
  });

  it("keeps the collapsed state and the width under `storageKey`", () => {
    const { unmount } = render(<Sidebar items={ITEMS} storageKey="app" />);
    press(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(window.localStorage.getItem("app:collapsed")).toBe("true");
    unmount();
    render(<Sidebar items={ITEMS} storageKey="app" data-testid="sidebar" />);
    expect(screen.getByTestId("sidebar").getAttribute("data-collapsed")).toBe("true");
  });

  it("toggles on Cmd or Ctrl+B, but not while the user types or when the shortcut is off", () => {
    const { unmount } = render(
      <>
        <input aria-label="Note" />
        <Sidebar items={ITEMS} data-testid="sidebar" />
      </>,
    );
    const root = screen.getByTestId("sidebar");
    shortcut({ key: "b", ctrlKey: true });
    expect(root.getAttribute("data-collapsed")).toBe("true");
    shortcut({ key: "B", metaKey: true });
    expect(root.hasAttribute("data-collapsed")).toBe(false);
    shortcut({ key: "b", ctrlKey: true }, screen.getByRole("textbox"));
    expect(root.hasAttribute("data-collapsed")).toBe(false);
    unmount();
    render(<Sidebar items={ITEMS} keyboardShortcut={false} data-testid="other" />);
    shortcut({ key: "b", ctrlKey: true });
    expect(screen.getByTestId("other").hasAttribute("data-collapsed")).toBe(false);
  });

  it("draws the rail: a rule for a group heading, the active entry lit, a badge as a dot", () => {
    render(<Sidebar items={ITEMS} isCollapsed />);
    const nav = screen.getByRole("navigation");
    expect(nav.querySelector("[data-slot=sidebar-group-rule]")).not.toBeNull();
    expect(within(nav).getByRole("group", { name: "Settings" })).toBeTruthy();
    expect(nav.textContent).not.toContain("SettingsProfile");
    const orders = within(nav).getByRole("link", { name: /Orders/ });
    expect(orders.getAttribute("data-active")).toBe("true");
    expect(orders.querySelector("svg")).not.toBeNull();
    expect(orders.querySelector('[class~="rounded-[var(--radius-pill)]"].size-2')).not.toBeNull();
    // Every label stays a spoken name.
    expect(within(nav).getByRole("link", { name: "Home" })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: "Billing" })).toBeTruthy();
  });

  it("moves focus with the arrow keys, Home and End, wrapping at the ends", () => {
    render(<Sidebar items={ITEMS} />);
    const [home, , , billing] = within(screen.getByRole("navigation")).getAllByRole("link");
    act(() => home?.focus());
    fireEvent.keyDown(home as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement?.textContent).toContain("Orders");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(billing);
    fireEvent.keyDown(billing as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(home);
    fireEvent.keyDown(home as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(billing);
    fireEvent.keyDown(billing as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(home);
  });

  it("slides away in offcanvas mode, inert, and hands focus to the trigger outside", () => {
    render(
      <SidebarProvider collapsible="offcanvas">
        <Sidebar items={ITEMS} data-testid="sidebar" />
        <Sidebar.Inset>
          <Sidebar.Trigger data-testid="outside" />
        </Sidebar.Inset>
      </SidebarProvider>,
    );
    const root = screen.getByTestId("sidebar");
    const inside = within(root).getByRole("button", { name: "Collapse sidebar" });
    act(() => inside.focus());
    press(inside);
    expect(root.style.width).toBe("0px");
    expect(root.querySelector("[data-slot=sidebar-panel]")?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(screen.getByTestId("outside"));
    expect(screen.getByTestId("outside").getAttribute("aria-expanded")).toBe("false");
  });

  it("filters the places from its search box, keeping the group that leads to a match", () => {
    render(<Sidebar items={ITEMS} isSearchable />);
    const search = screen.getByRole("searchbox", { name: "Filter navigation" });
    fireEvent.change(search, { target: { value: "bill" } });
    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link", { name: "Home" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Billing" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(within(nav).getByRole("status").textContent).toBe("No matching places");
  });

  it("shows loading rows and announces them once", () => {
    render(<Sidebar items={ITEMS} isLoading />);
    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link")).toBeNull();
    expect(within(nav).getByRole("status").textContent).toBe("Loading navigation");
    expect(nav.querySelectorAll("[data-slot=sidebar-menu-skeleton]").length).toBeGreaterThan(0);
  });

  it("resizes from its rail with the arrow keys, within its bounds", () => {
    const onWidthChange = vi.fn();
    render(
      <Sidebar
        items={ITEMS}
        isResizable
        maxWidth={272}
        onWidthChange={onWidthChange}
        data-testid="sidebar"
      />,
    );
    const rail = screen.getByRole("separator", { name: "Resize sidebar" });
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(272);
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(272);
    fireEvent.keyDown(rail, { key: "Home" });
    expect(screen.getByTestId("sidebar").style.width).toBe("208px");
  });

  it("drags its rail: a press toggles, a drag resizes, a drag past half the minimum collapses, and out expands", () => {
    Element.prototype.setPointerCapture = vi.fn();
    const onWidthChange = vi.fn();
    const onCollapsedChange = vi.fn();
    render(
      <Sidebar
        items={ITEMS}
        isResizable
        onWidthChange={onWidthChange}
        onCollapsedChange={onCollapsedChange}
        data-testid="sidebar"
      />,
    );
    const root = screen.getByTestId("sidebar");
    const rail = () => root.querySelector<HTMLElement>("[data-slot=sidebar-rail]") as HTMLElement;
    const drag = (from: number, to: number) => {
      fireEvent.pointerDown(rail(), { button: 0, pointerId: 1, clientX: from });
      fireEvent.pointerMove(rail(), { pointerId: 1, clientX: to });
      fireEvent.pointerUp(rail(), { pointerId: 1, clientX: to });
    };
    // A secondary button starts nothing.
    fireEvent.pointerDown(rail(), { button: 2, clientX: 0 });
    fireEvent.pointerUp(rail(), { clientX: 0 });
    expect(onCollapsedChange).not.toHaveBeenCalled();
    drag(0, 20);
    expect(onWidthChange).toHaveBeenLastCalledWith(276);
    drag(0, -200);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(rail().getAttribute("aria-hidden")).toBe("true");
    // Collapsed: a small drag out does nothing, a long one expands.
    drag(0, 5);
    expect(root.getAttribute("data-collapsed")).toBe("true");
    drag(0, 40);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    // A press without a move toggles.
    drag(0, 0);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
  });

  it("leaves the toggle out when it is not collapsible", () => {
    render(<Sidebar items={ITEMS.slice(0, 2)} isCollapsible={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("becomes a drawer below the mobile breakpoint, opened by its trigger", () => {
    screenSize.current = { breakpoint: undefined, sizeClass: "phone" };
    render(
      <SidebarProvider>
        <Sidebar items={ITEMS} label="Main navigation" />
        <Sidebar.Trigger />
      </SidebarProvider>,
    );
    expect(screen.queryByRole("navigation")).toBeNull();
    press(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  });

  it("draws composed parts, and passes unknown props through", () => {
    render(
      <Sidebar id="side" className="extra" data-testid="sidebar">
        <Sidebar.Header>Acme</Sidebar.Header>
        <Sidebar.Content label="Main">
          <Sidebar.Group label="Projects" isCollapsible action={<button type="button">Add</button>}>
            <Sidebar.Menu>
              <Sidebar.MenuItem label="Alpha" href="/alpha" isActive shortcut="G A" />
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar>,
    );
    const root = screen.getByTestId("sidebar");
    expect(root.id).toBe("side");
    expect(root.className).toContain("extra");
    expect(screen.getByRole("link", { name: /Alpha/ }).getAttribute("aria-current")).toBe("page");
    const heading = screen.getByRole("button", { name: "Projects" });
    press(heading);
    expect(heading.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: /Alpha/ })).toBeNull();
  });
});
