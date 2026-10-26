/**
 * Stackra file contract:
 * Purpose: proves the native NavigationList names its navigation View, draws every entry with somewhere to go as a
 *          pressable link-role ListItem with its icon, label and badge (none for zero or an empty string), selects and
 *          fills the current place and an entry that only holds it, draws an entry with only children as a muted group
 *          heading over its nested rows, runs a handler then follows an app path through the nearest RouterProvider or
 *          an absolute URL through `Linking`, refuses a disabled row, passes unknown props through and refuses a raw
 *          `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native, HeroUI Native's ListGroup and the native ListItem and
 *           Text are replaced by recording stand-ins that render plain DOM, so what reaches them is checked, not their
 *           rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1, 3, 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-157
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Linking } from "react-native";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { NavigationList } from "#native/navigation-list/navigation-list";
import type { NavigationListProps } from "#native/navigation-list/navigation-list.props";
import { RouterContext } from "#native/router-provider/router-context";

vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn(() => Promise.resolve()) },
  View: ({
    children,
    role,
    accessibilityLabel,
    className,
    testID,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      role={role as string | undefined}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
    >
      {children}
    </div>
  ),
}));
vi.mock("heroui-native", () => ({
  ListGroup: ({ children }: { children?: ReactNode }) => <div data-testid="group">{children}</div>,
}));
vi.mock("#native/list/list-item", () => ({
  ListItem: ({
    title,
    startIcon,
    endContent,
    onPress,
    isDisabled,
    accessibilityRole,
    accessibilityState,
    className,
  }: Record<string, unknown>) => (
    <button
      data-testid="row"
      role={accessibilityRole as string | undefined}
      data-icon={startIcon as string | undefined}
      data-badge={endContent === undefined ? undefined : String(endContent)}
      data-selected={String((accessibilityState as { selected?: boolean } | undefined)?.selected)}
      disabled={isDisabled === true}
      className={className as string | undefined}
      onClick={() => (onPress as (() => void) | undefined)?.()}
    >
      {title as ReactNode}
    </button>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children, type, tone }: Record<string, unknown> & { children?: ReactNode }) => (
    <span data-testid="text" data-type={String(type)} data-tone={String(tone)}>
      {children}
    </span>
  ),
}));

const ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/", icon: "house" },
  { id: "orders", label: "Orders", href: "/orders", badge: 12 },
  {
    id: "settings",
    label: "Settings",
    children: [
      { id: "profile", label: "Profile", href: "/settings/profile", isCurrent: true },
      { id: "billing", label: "Billing", href: "/settings/billing" },
    ],
  },
];

const rowOf = (name: string) => screen.getByRole("link", { name });

describe("NavigationList (native)", () => {
  afterEach(() => vi.mocked(Linking.openURL).mockClear());

  it("is a navigation View with a default name, or the caller's", () => {
    const { rerender } = render(<NavigationList items={ITEMS} />);
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("Navigation");
    rerender(<NavigationList items={ITEMS} label="Settings menu" />);
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("Settings menu");
  });

  it("draws every entry with somewhere to go as a link-role row with its icon and badge", () => {
    render(<NavigationList items={ITEMS} />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(rowOf("Home").getAttribute("data-icon")).toBe("house");
    expect(rowOf("Orders").getAttribute("data-badge")).toBe("12");
  });

  it("draws no badge for zero or an empty string", () => {
    render(
      <NavigationList
        items={[
          { id: "a", label: "Alpha", href: "/a", badge: 0 },
          { id: "b", label: "Beta", href: "/b", badge: "" },
        ]}
      />,
    );
    expect(rowOf("Alpha").hasAttribute("data-badge")).toBe(false);
    expect(rowOf("Beta").hasAttribute("data-badge")).toBe(false);
  });

  it("selects and fills the current place, and an entry that only holds it", () => {
    render(
      <NavigationList
        items={[
          {
            id: "settings",
            label: "Settings",
            href: "/settings",
            children: [
              { id: "profile", label: "Profile", href: "/settings/profile", isCurrent: true },
            ],
          },
          { id: "home", label: "Home", href: "/" },
        ]}
      />,
    );
    expect(rowOf("Profile").getAttribute("data-selected")).toBe("true");
    expect(rowOf("Profile").className).toContain("bg-default");
    expect(rowOf("Settings").getAttribute("data-selected")).toBe("true");
    expect(rowOf("Home").getAttribute("data-selected")).toBe("false");
    expect(rowOf("Home").className).not.toContain("bg-default");
  });

  it("draws an entry with only children as a muted small heading, not a row", () => {
    render(<NavigationList items={ITEMS} />);
    const heading = screen.getByText("Settings");
    expect(heading.getAttribute("data-type")).toBe("small");
    expect(heading.getAttribute("data-tone")).toBe("muted");
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
  });

  it("indents a nested level", () => {
    render(<NavigationList items={ITEMS} />);
    const nested = rowOf("Profile").closest("[class*='ms-4']");
    expect(nested).toBeTruthy();
    expect(rowOf("Home").closest("[class*='ms-4']")).toBeNull();
  });

  it("runs the handler, then navigates an app path through the nearest RouterProvider", () => {
    const navigate = vi.fn();
    const onPress = vi.fn();
    render(
      <RouterContext.Provider value={navigate}>
        <NavigationList items={[{ id: "a", label: "Alpha", href: "/a", onPress }]} />
      </RouterContext.Provider>,
    );
    fireEvent.click(rowOf("Alpha"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/a");
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("opens an absolute URL with Linking even inside a RouterProvider", () => {
    const navigate = vi.fn();
    render(
      <RouterContext.Provider value={navigate}>
        <NavigationList items={[{ id: "a", label: "Docs", href: "https://example.com/docs" }]} />
      </RouterContext.Provider>,
    );
    fireEvent.click(rowOf("Docs"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/docs");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("opens an app path with Linking when there is no RouterProvider", () => {
    render(<NavigationList items={[{ id: "a", label: "Alpha", href: "/a" }]} />);
    fireEvent.click(rowOf("Alpha"));
    expect(Linking.openURL).toHaveBeenCalledWith("/a");
  });

  it("runs only the handler of a press-only entry", () => {
    const onPress = vi.fn();
    render(<NavigationList items={[{ id: "a", label: "Alpha", onPress }]} />);
    fireEvent.click(rowOf("Alpha"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("hands a disabled entry to the row as disabled", () => {
    render(<NavigationList items={[{ id: "a", label: "Alpha", href: "/a", isDisabled: true }]} />);
    expect((rowOf("Alpha") as HTMLButtonElement).disabled).toBe(true);
  });

  it("passes unknown props through and refuses a raw accessibilityLabel at the type level", () => {
    render(<NavigationList items={ITEMS} testID="nav" />);
    expect(screen.getByTestId("nav")).toBeTruthy();
    // @ts-expect-error: the landmark's name is `label`, not `accessibilityLabel`
    const refused: NavigationListProps = { items: ITEMS, accessibilityLabel: "x" };
    expect(refused.items).toBe(ITEMS);
  });
});
