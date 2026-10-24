/**
 * Stackra file contract:
 * Purpose: proves the native Sidebar stacks its start content, the NavigationList and its end content, hands the items
 *          and the label to the list, draws a string or number slot inside Text, merges the caller's class, passes
 *          unknown props through, accepts the collapsed props without reading or forwarding them (a phone has no rail),
 *          and refuses JSX children at the type level.
 * Boundary: React Native does not render in vitest: react-native, the native NavigationList and Text are replaced by
 *           recording stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-159
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { Sidebar, type SidebarProps } from "#native/sidebar/sidebar";

vi.mock("react-native", () => ({
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

  it("accepts the collapsed props and neither reads, calls nor forwards them", () => {
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
