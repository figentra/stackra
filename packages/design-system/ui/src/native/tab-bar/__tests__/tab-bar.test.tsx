/**
 * Stackra file contract:
 * Purpose: proves the native TabBar is a `tablist` named by `label` (default "Tabs") with one `tab` for each of the
 *          first five items in order and a development warning for a sixth, draws each tab's icon (an icon name through
 *          Icon in the accent tone for the current tab and muted for the rest, an element as given), its label and a
 *          count badge only when the badge is not zero or empty, announces the current tab (an ancestor of the current
 *          item too) as selected and the badge in the accessible name, refuses presses on a disabled tab, runs `onPress`
 *          before opening `href` through the nearest RouterProvider (an app path only, nothing without a provider),
 *          pads the bottom by the safe-area inset, merges the caller's classes and style, passes unknown props to the
 *          root, and refuses `accessibilityLabel` and `accessibilityRole` at the type level.
 * Boundary: React Native does not render in vitest: react-native, the safe-area context and the native Badge, Icon and
 *           Text are replaced by recording stand-ins that render plain DOM, so what reaches them is checked, not their
 *           rendering. The RouterProvider is the real one.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 3 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-176
import { act, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { RouterProvider } from "#native/router-provider/router-provider";
import { TabBar } from "#native/tab-bar/tab-bar";
import type { TabBarProps } from "#native/tab-bar/tab-bar.props";

vi.mock("react-native", () => ({
  View: ({
    children,
    testID,
    className,
    accessibilityLabel,
    accessibilityRole,
    style,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      data-role={accessibilityRole as string | undefined}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
      data-style={JSON.stringify(style)}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
  Pressable: ({
    children,
    accessibilityRole,
    accessibilityLabel,
    accessibilityState,
    disabled,
    onPress,
    className,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <button
      type="button"
      data-role={accessibilityRole as string}
      aria-label={accessibilityLabel as string}
      data-selected={String((accessibilityState as { selected: boolean }).selected)}
      className={className as string}
      disabled={disabled as boolean}
      onClick={onPress as () => void}
    >
      {children}
    </button>
  ),
}));
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
vi.mock("#native/badge/badge", () => ({
  Badge: Object.assign(
    ({ children, tone, size }: { children?: ReactNode; tone: string; size: string }) => (
      <b data-testid="badge" data-tone={tone} data-size={size}>
        {children}
      </b>
    ),
    { Anchor: ({ children }: { children?: ReactNode }) => <span>{children}</span> },
  ),
}));
vi.mock("#native/icon/icon", () => ({
  Icon: ({ name, tone }: { name: string; tone: string }) => (
    <i data-testid="icon" data-name={name} data-tone={tone} />
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({
    children,
    tone,
    className,
    isTruncated,
  }: {
    children?: ReactNode;
    tone: string;
    className?: string;
    isTruncated?: boolean;
  }) => (
    <span data-testid="text" data-tone={tone} className={className} data-truncated={isTruncated}>
      {children}
    </span>
  ),
}));

/** Three tabs, the second the current place. */
const ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", icon: "house" },
  { id: "orders", label: "Orders", icon: "package", isCurrent: true },
  { id: "profile", label: "Profile", icon: <i data-testid="own-icon" /> },
];

const tab = (name: string) => screen.getByRole("button", { name });

describe("TabBar (native)", () => {
  it("is a tablist named 'Tabs' by default, or by `label`", () => {
    const { rerender } = render(<TabBar testID="bar" items={ITEMS} />);
    expect(screen.getByTestId("bar").getAttribute("data-role")).toBe("tablist");
    expect(screen.getByTestId("bar").getAttribute("aria-label")).toBe("Tabs");
    rerender(<TabBar testID="bar" items={ITEMS} label="Main tabs" />);
    expect(screen.getByTestId("bar").getAttribute("aria-label")).toBe("Main tabs");
  });

  it("draws one tab for each item, in order, each with the tab role", () => {
    render(<TabBar items={ITEMS} />);
    const tabs = screen.getAllByRole("button");
    expect(tabs.map((node) => node.getAttribute("aria-label"))).toEqual([
      "Home",
      "Orders",
      "Profile",
    ]);
    for (const node of tabs) expect(node.getAttribute("data-role")).toBe("tab");
  });

  it("draws the first five items only and warns about a sixth in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const six = Array.from({ length: 6 }, (_, index) => ({
      id: `t${index}`,
      label: `Tab ${index}`,
    }));
    render(<TabBar items={six} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("announces the current tab as selected and draws it in the accent tone", () => {
    render(<TabBar items={ITEMS} />);
    expect(tab("Orders").getAttribute("data-selected")).toBe("true");
    expect(tab("Home").getAttribute("data-selected")).toBe("false");
    expect(within(tab("Orders")).getByTestId("icon").getAttribute("data-tone")).toBe("accent");
    expect(within(tab("Orders")).getByTestId("text").getAttribute("data-tone")).toBe("accent");
    expect(within(tab("Home")).getByTestId("icon").getAttribute("data-tone")).toBe("muted");
    expect(within(tab("Home")).getByTestId("text").getAttribute("data-tone")).toBe("muted");
  });

  it("counts a tab whose child is the current place as selected", () => {
    const items = [
      { id: "a", label: "Sales", children: [{ id: "b", label: "Orders", isCurrent: true }] },
    ];
    render(<TabBar items={items} />);
    expect(tab("Sales").getAttribute("data-selected")).toBe("true");
  });

  it("draws an icon name through Icon and an element as given", () => {
    render(<TabBar items={ITEMS} />);
    expect(within(tab("Home")).getByTestId("icon").getAttribute("data-name")).toBe("house");
    expect(within(tab("Profile")).getByTestId("own-icon")).toBeTruthy();
    expect(within(tab("Profile")).queryByTestId("icon")).toBeNull();
  });

  it("draws the label inside Text on one line", () => {
    render(<TabBar items={ITEMS} />);
    const label = within(tab("Home")).getByTestId("text");
    expect(label.textContent).toBe("Home");
    expect(label.getAttribute("data-truncated")).toBe("true");
  });

  it("draws a badge and puts it in the accessible name, but not a zero or empty one", () => {
    render(
      <TabBar
        items={[
          { id: "a", label: "Inbox", badge: 3 },
          { id: "b", label: "Alerts", badge: 0 },
          { id: "c", label: "Chat", badge: "" },
          { id: "d", label: "News", badge: "new" },
        ]}
      />,
    );
    expect(within(tab("Inbox, 3")).getByTestId("badge").textContent).toBe("3");
    expect(within(tab("Alerts")).queryByTestId("badge")).toBeNull();
    expect(within(tab("Chat")).queryByTestId("badge")).toBeNull();
    expect(within(tab("News, new")).getByTestId("badge").getAttribute("data-size")).toBe("sm");
  });

  it("refuses presses on a disabled tab", () => {
    const onPress = vi.fn();
    render(<TabBar items={[{ id: "a", label: "Admin", isDisabled: true, onPress }]} />);
    expect((tab("Admin") as HTMLButtonElement).disabled).toBe(true);
    act(() => tab("Admin").click());
    expect(onPress).not.toHaveBeenCalled();
  });

  it("runs onPress, then opens href through the RouterProvider", () => {
    const calls: string[] = [];
    render(
      <RouterProvider navigate={(href) => calls.push(`go ${href}`)}>
        <TabBar
          items={[
            { id: "a", label: "Orders", href: "/orders", onPress: () => calls.push("press") },
          ]}
        />
      </RouterProvider>,
    );
    act(() => tab("Orders").click());
    expect(calls).toEqual(["press", "go /orders"]);
  });

  it("does not follow a URL with a scheme, and does nothing for href without a provider", () => {
    const navigate = vi.fn();
    const { rerender } = render(
      <RouterProvider navigate={navigate}>
        <TabBar items={[{ id: "a", label: "Docs", href: "https://example.com" }]} />
      </RouterProvider>,
    );
    act(() => tab("Docs").click());
    expect(navigate).not.toHaveBeenCalled();
    rerender(<TabBar items={[{ id: "a", label: "Docs", href: "/docs" }]} />);
    expect(() => act(() => tab("Docs").click())).not.toThrow();
  });

  it("keeps each tab at least 56 points high, past the 24 px minimum", () => {
    render(<TabBar items={ITEMS} />);
    expect(tab("Home").className).toContain("min-h-14");
  });

  it("pads the bottom by the safe-area inset", () => {
    render(<TabBar testID="bar" items={ITEMS} />);
    expect(JSON.parse(screen.getByTestId("bar").getAttribute("data-style") ?? "[]")).toContainEqual(
      {
        paddingBottom: 34,
      },
    );
  });

  it("merges the caller's classes and style and passes unknown props to the root", () => {
    render(
      <TabBar
        testID="bar"
        items={ITEMS}
        className="extra"
        style={{ opacity: 0.5 }}
        accessibilityHint="Tabs"
      />,
    );
    const bar = screen.getByTestId("bar");
    expect(bar.className).toContain("extra");
    expect(bar.className).toContain("border-t");
    expect(bar.getAttribute("data-style")).toContain("0.5");
    expect(bar.getAttribute("data-extra")).toContain("accessibilityHint");
  });

  it("refuses the raw `accessibilityLabel` and `accessibilityRole` at the type level", () => {
    // @ts-expect-error: `label` is the bar's name, not `accessibilityLabel`
    const label: TabBarProps = { items: [], accessibilityLabel: "Tabs" };
    // @ts-expect-error: the bar's role is always `tablist`
    const role: TabBarProps = { items: [], accessibilityRole: "menu" };
    expect([label, role]).toBeTruthy();
  });
});
