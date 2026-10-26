/**
 * Stackra file contract:
 * Purpose: proves the web Sidebar stacks its start content, its navigation and its end content, names the navigation
 *          with `label`, collapses to an icon rail and back from its own toggle (uncontrolled, from `defaultCollapsed`,
 *          or controlled by `isCollapsed`), reports each change, leaves the toggle out when it is not collapsible,
 *          keeps every label as an accessible name in the rail, passes unknown props through and refuses JSX children
 *          at the type level.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1 and 4); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-158
import { act, render, screen, within } from "@testing-library/react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { Sidebar } from "#react/sidebar/sidebar";
import type { SidebarProps } from "#react/sidebar/sidebar.props";

const ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/", icon: "house" },
  { id: "orders", label: "Orders", href: "/orders", icon: "package", isCurrent: true },
];

const press = (element: HTMLElement) => act(() => element.click());

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

  it("marks the current entry through the navigation list", () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Orders" }).getAttribute("aria-current")).toBe("page");
  });

  it("collapses and expands from its own toggle, reporting each change", () => {
    const onCollapsedChange = vi.fn();
    render(<Sidebar items={ITEMS} onCollapsedChange={onCollapsedChange} data-testid="sidebar" />);
    const root = screen.getByTestId("sidebar");
    expect(root.hasAttribute("data-collapsed")).toBe(false);
    press(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(root.getAttribute("data-collapsed")).toBe("true");
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    press(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(root.hasAttribute("data-collapsed")).toBe(false);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
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

  it("draws the rail 4 rem wide and the full sidebar 16 rem wide", () => {
    const { rerender } = render(<Sidebar items={ITEMS} data-testid="sidebar" />);
    expect(screen.getByTestId("sidebar").className).toContain("w-64");
    rerender(<Sidebar items={ITEMS} isCollapsed data-testid="sidebar" />);
    expect(screen.getByTestId("sidebar").className).toContain("w-16");
  });

  it("keeps every label as an accessible name in the rail", () => {
    render(<Sidebar items={ITEMS} isCollapsed />);
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("link", { name: "Home" })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: "Orders" })).toBeTruthy();
  });

  it("leaves the toggle out when it is not collapsible", () => {
    render(<Sidebar items={ITEMS} isCollapsible={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("passes unknown props through and refuses JSX children at the type level", () => {
    render(<Sidebar items={ITEMS} id="side" className="extra" data-testid="sidebar" />);
    expect(screen.getByTestId("sidebar").id).toBe("side");
    expect(screen.getByTestId("sidebar").className).toContain("extra");
    // @ts-expect-error: the sidebar's content is `items` and its slots, not children
    const refused: SidebarProps = { items: ITEMS, children: "x" };
    expect(refused.items).toBe(ITEMS);
  });
});
