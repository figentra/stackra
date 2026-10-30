/**
 * Stackra file contract:
 * Purpose: proves the native Sidebar stacks its start content, the NavigationList and its end content, hands the items
 *          and the label to the list, draws a string or number slot inside Text, merges the caller's class, passes
 *          unknown props through, ignores the collapsed props on a phone (no rail there), draws a toggle and an icon
 *          rail on a tablet, becomes a drawer on a phone when given `isMobileOpen`, filters from its search box, and
 *          refuses JSX children at the type level.
 * Boundary: React Native does not render in vitest: react-native, the native NavigationList, Text, IconButton,
 *           SearchField, Skeleton, Drawer and the breakpoint are replaced by recording stand-ins that render plain DOM,
 *           so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-159
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { Sidebar } from "#native/sidebar/sidebar";
import type { SidebarProps } from "#native/sidebar/sidebar.props";

const size: { current: "phone" | "tablet" } = { current: "phone" };
vi.mock("#native/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => ({
    breakpoint: size.current === "phone" ? undefined : "md",
    sizeClass: size.current,
  }),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button type="button" data-testid="toggle" onClick={onPress}>
      {label}
    </button>
  ),
}));
vi.mock("#native/search-field/search-field", () => ({
  SearchField: ({ label, onChange }: { label: string; onChange: (value: string) => void }) => (
    <input aria-label={label} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock("#native/skeleton/skeleton", () => ({ Skeleton: () => <i data-testid="bone" /> }));
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => <i data-testid="icon" /> }));
vi.mock("#native/drawer/drawer", () => ({
  Drawer: Object.assign(
    ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) => (
      <div data-testid="drawer" data-open={String(isOpen)}>
        {children}
      </div>
    ),
    { Body: ({ children }: { children?: ReactNode }) => <>{children}</> },
  ),
}));
vi.mock("react-native", () => ({
  Pressable: ({
    children,
    accessibilityLabel,
    accessibilityState,
    onPress,
  }: {
    children?: ReactNode;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean };
    onPress?: () => void;
  }) => (
    <button
      type="button"
      aria-label={accessibilityLabel}
      // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- the button stands in for a Pressable and surfaces accessibilityState.selected for the test to read
      aria-selected={accessibilityState?.selected}
      onClick={onPress}
    >
      {children}
    </button>
  ),
  View: ({
    children,
    className,
    testID,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      className={className as string | undefined}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/navigation-list/navigation-list", () => ({
  NavigationList: ({ items, label }: { items: readonly NavigationItem[]; label?: string }) => (
    <div data-testid="list" data-count={items.length} data-label={label} />
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));

const ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "orders", label: "Orders", href: "/orders" },
];

describe("Sidebar (native)", () => {
  it("stacks the start content, the list and the end content in order", () => {
    render(
      <Sidebar
        items={ITEMS}
        startContent={<i data-testid="start" />}
        endContent={<i data-testid="end" />}
        testID="sidebar"
      />,
    );
    const children = [...screen.getByTestId("sidebar").children].map((child) =>
      child.getAttribute("data-testid"),
    );
    expect(children).toEqual(["start", "list", "end"]);
  });

  it("hands the items and the label to the list, and the default name when there is none", () => {
    const { rerender } = render(<Sidebar items={ITEMS} label="Main navigation" />);
    expect(screen.getByTestId("list").getAttribute("data-count")).toBe("2");
    expect(screen.getByTestId("list").getAttribute("data-label")).toBe("Main navigation");
    rerender(<Sidebar items={ITEMS} />);
    expect(screen.getByTestId("list").hasAttribute("data-label")).toBe(false);
  });

  it("draws a string or number slot inside Text, never bare in the View", () => {
    render(<Sidebar items={ITEMS} startContent="Acme" endContent={3} />);
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual(["Acme", "3"]);
  });

  it("merges the caller's class and passes unknown props through", () => {
    render(<Sidebar items={ITEMS} className="extra" testID="sidebar" accessibilityHint="Menu" />);
    const root = screen.getByTestId("sidebar");
    expect(root.className).toContain("extra");
    expect(root.getAttribute("data-extra")).toContain("accessibilityHint");
  });

  it("on a tablet draws a toggle that collapses it to a rail of named icons, the current one selected", () => {
    size.current = "tablet";
    const onCollapsedChange = vi.fn();
    const items: readonly NavigationItem[] = [
      { id: "home", label: "Home", href: "/", icon: "house", isCurrent: true },
      { id: "inbox", label: "Inbox", href: "/inbox", badge: 4 },
    ];
    render(<Sidebar items={items} onCollapsedChange={onCollapsedChange} />);
    expect(screen.getByTestId("list")).toBeTruthy();
    act(() => screen.getByTestId("toggle").click());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByTestId("list")).toBeNull();
    expect(screen.getByRole("button", { name: "Home" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Inbox (4)" })).toBeTruthy();
    size.current = "phone";
  });

  it("is a drawer on a phone when the app owns its open state", () => {
    render(<Sidebar items={ITEMS} isMobileOpen onMobileOpenChange={() => {}} />);
    expect(screen.getByTestId("drawer").getAttribute("data-open")).toBe("true");
    expect(screen.getByTestId("list")).toBeTruthy();
  });

  it("filters from its search box and shows placeholders while loading", () => {
    const { rerender } = render(<Sidebar items={ITEMS} isSearchable />);
    fireEvent.change(screen.getByRole("textbox", { name: "Filter navigation" }), {
      target: { value: "ord" },
    });
    expect(screen.getByTestId("list").getAttribute("data-count")).toBe("1");
    rerender(<Sidebar items={ITEMS} isLoading />);
    expect(screen.getAllByTestId("bone").length).toBeGreaterThan(0);
  });

  it("accepts the collapsed props on a phone and neither reads, calls nor forwards them", () => {
    const onCollapsedChange = vi.fn();
    render(
      <Sidebar
        items={ITEMS}
        isCollapsed
        defaultCollapsed
        onCollapsedChange={onCollapsedChange}
        testID="sidebar"
      />,
    );
    expect(onCollapsedChange).not.toHaveBeenCalled();
    const extra = screen.getByTestId("sidebar").getAttribute("data-extra") ?? "";
    expect(extra).not.toContain("isCollapsed");
    expect(extra).not.toContain("onCollapsedChange");
  });

  it("refuses JSX children at the type level", () => {
    // @ts-expect-error: the sidebar's content is `items` and its slots, not children
    const refused: SidebarProps = { items: ITEMS, children: "x" };
    expect(refused.items).toBe(ITEMS);
  });
});
