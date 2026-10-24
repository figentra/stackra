/**
 * Stackra file contract:
 * Purpose: proves the native PageHeader hands the shared Heading its level (default 1) and the `h3` style, draws the
 *          description, status, start and end slots (a string or number inside Text), the trail only when it has steps,
 *          the first action as the primary button and the next two as secondary ones, a danger action in the danger
 *          colours, an action's `onPress` and then its `href` through the RouterProvider or the system browser (a failed
 *          open warns without the URL), a disabled action as a disabled button, the actions past three in an ActionMenu
 *          named by `moreActionsLabel`, `label` as the accessibility label only when given, and that it passes unknown
 *          props to the root `View` and refuses a missing title and `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native, the native Heading, Text, Button, Breadcrumbs and
 *           ActionMenu are replaced by recording stand-ins that render plain DOM, so what reaches them is checked, not
 *           their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-167
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { PageHeader, type PageHeaderProps } from "#native/page-header/page-header";
import { RouterContext } from "#native/router-provider/router-context";

/** What the stand-ins were last handed: the Linking mock, the buttons and the menus. */
const received = vi.hoisted(() => ({
  openURL: undefined as unknown as (url: string) => Promise<void>,
  menus: [] as Record<string, unknown>[],
}));

vi.mock("react-native", () => ({
  Linking: { openURL: (url: string) => received.openURL(url) },
  View: ({
    children,
    className,
    accessibilityLabel,
    testID,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));
vi.mock("#native/heading/heading", () => ({
  Heading: ({ level, type, children }: { level: number; type: string; children?: ReactNode }) => (
    <h2 data-testid="heading" data-level={level} data-type={type}>
      {children}
    </h2>
  ),
}));
vi.mock("#native/breadcrumbs/breadcrumbs", () => ({
  Breadcrumbs: ({ items }: { items: readonly { id: string }[] }) => (
    <nav data-testid="trail">{items.map((item) => item.id).join(",")}</nav>
  ),
}));
vi.mock("#native/button/button", () => ({
  Button: ({
    children,
    variant,
    isDisabled,
    startIcon,
    onPress,
  }: {
    children?: ReactNode;
    variant?: string;
    isDisabled?: boolean;
    startIcon?: ReactNode;
    onPress?: () => void;
  }) => (
    <button type="button" data-variant={variant} disabled={isDisabled} onClick={onPress}>
      {startIcon}
      {children}
    </button>
  ),
}));
vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    received.menus.push(props);
    return <button type="button" aria-label={String(props["label"])} data-testid="more" />;
  },
}));

/** `count` actions named `Action 1`, `Action 2` and so on, with the given extras on the first. */
const actionsOf = (count: number, first: Partial<MenuLeafItem> = {}): MenuLeafItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `a${index + 1}`,
    label: `Action ${index + 1}`,
    ...(index === 0 ? first : {}),
  }));

const buttons = () => screen.getAllByRole("button").filter((button) => button.dataset["variant"]);

describe("PageHeader (native)", () => {
  beforeEach(() => {
    received.menus.length = 0;
    received.openURL = () => Promise.resolve();
  });

  it("hands Heading the level, default 1, and the h3 style", () => {
    const { rerender } = render(<PageHeader title="Order 1042" />);
    const heading = screen.getByTestId("heading");
    expect(heading.getAttribute("data-level")).toBe("1");
    expect(heading.getAttribute("data-type")).toBe("h3");
    expect(heading.textContent).toBe("Order 1042");
    rerender(<PageHeader title="Order 1042" headingLevel={2} />);
    expect(screen.getByTestId("heading").getAttribute("data-level")).toBe("2");
  });

  it("draws the description, and a string or number in the slots, inside Text", () => {
    render(
      <PageHeader
        title="Order 1042"
        description="Placed on 3 March"
        status="Paid"
        startContent="Lead"
        actions={actionsOf(1)}
        endContent={7}
      />,
    );
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual([
      "Lead",
      "Paid",
      "Placed on 3 March",
      "7",
    ]);
  });

  it("draws a status node as given", () => {
    render(<PageHeader title="Order" status={<i data-testid="badge" />} />);
    expect(screen.getByTestId("badge")).toBeTruthy();
    expect(screen.queryByTestId("text")).toBeNull();
  });

  it("draws the trail only when it has steps", () => {
    const { rerender } = render(<PageHeader title="Order" breadcrumbs={[]} />);
    expect(screen.queryByTestId("trail")).toBeNull();
    rerender(
      <PageHeader
        title="Order"
        breadcrumbs={[
          { id: "orders", label: "Orders" },
          { id: "order", label: "Order" },
        ]}
      />,
    );
    expect(screen.getByTestId("trail").textContent).toBe("orders,order");
  });

  it("draws the first action as the primary button and the next two as secondary ones", () => {
    render(<PageHeader title="Order" actions={actionsOf(3)} />);
    expect(buttons().map((button) => [button.textContent, button.dataset["variant"]])).toEqual([
      ["Action 1", "primary"],
      ["Action 2", "secondary"],
      ["Action 3", "secondary"],
    ]);
  });

  it("draws a danger action in the danger colours, primary or not", () => {
    const { rerender } = render(
      <PageHeader title="Order" actions={actionsOf(1, { tone: "danger" })} />,
    );
    expect(buttons()[0]?.dataset["variant"]).toBe("danger");
    rerender(
      <PageHeader
        title="Order"
        actions={[
          { id: "a", label: "Save" },
          { id: "b", label: "Delete", tone: "danger" },
        ]}
      />,
    );
    expect(buttons()[1]?.dataset["variant"]).toBe("danger-soft");
  });

  it("draws an action's icon and disabled state", () => {
    render(
      <PageHeader
        title="Order"
        actions={actionsOf(1, { icon: <i data-testid="icon" />, isDisabled: true })}
      />,
    );
    const [button] = buttons();
    expect(button?.querySelector("[data-testid='icon']")).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("runs an action's onPress, and with no href nothing else", () => {
    const onPress = vi.fn();
    const navigate = vi.fn();
    const openURL = vi.fn(() => Promise.resolve());
    received.openURL = openURL;
    render(
      <RouterContext value={navigate}>
        <PageHeader title="Order" actions={actionsOf(1, { onPress })} />
      </RouterContext>,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("follows an app path through the RouterProvider after onPress", () => {
    const calls: string[] = [];
    const navigate = vi.fn(() => calls.push("navigate"));
    render(
      <RouterContext value={navigate}>
        <PageHeader
          title="Order"
          actions={actionsOf(1, { href: "/orders/new", onPress: () => calls.push("onPress") })}
        />
      </RouterContext>,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(navigate).toHaveBeenCalledWith("/orders/new");
    expect(calls).toEqual(["onPress", "navigate"]);
  });

  it("opens an absolute URL in the system browser, and an app path when there is no router", () => {
    const openURL = vi.fn(() => Promise.resolve());
    received.openURL = openURL;
    const navigate = vi.fn();
    const { rerender } = render(
      <RouterContext value={navigate}>
        <PageHeader title="Order" actions={actionsOf(1, { href: "https://example.com/x" })} />
      </RouterContext>,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(openURL).toHaveBeenCalledWith("https://example.com/x");
    expect(navigate).not.toHaveBeenCalled();
    rerender(<PageHeader title="Order" actions={actionsOf(1, { href: "/orders" })} />);
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(openURL).toHaveBeenLastCalledWith("/orders");
  });

  it("warns without the URL when the system browser cannot open it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    received.openURL = () => Promise.reject(new Error("no handler"));
    render(
      <PageHeader title="Order" actions={actionsOf(1, { href: "https://example.com/secret" })} />,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(String(warn.mock.calls[0])).not.toContain("secret");
    warn.mockRestore();
  });

  it("puts the actions past three in an ActionMenu named by moreActionsLabel", () => {
    render(
      <PageHeader title="Order" actions={actionsOf(5)} moreActionsLabel="More for this order" />,
    );
    expect(buttons()).toHaveLength(3);
    const [menu] = received.menus;
    expect(menu?.["label"]).toBe("More for this order");
    expect(menu?.["variant"]).toBe("secondary");
    const sections = menu?.["sections"] as { items: { id: string }[]; isTitleHidden: boolean }[];
    expect(sections).toHaveLength(1);
    expect(sections[0]?.isTitleHidden).toBe(true);
    expect(sections[0]?.items.map((item) => item.id)).toEqual(["a4", "a5"]);
  });

  it("names the overflow menu 'More actions' by default and draws none when everything fits", () => {
    const { rerender } = render(<PageHeader title="Order" actions={actionsOf(4)} />);
    expect(received.menus.at(-1)?.["label"]).toBe("More actions");
    received.menus.length = 0;
    rerender(<PageHeader title="Order" actions={actionsOf(3)} />);
    expect(received.menus).toHaveLength(0);
    expect(screen.queryByTestId("more")).toBeNull();
  });

  it("draws the end slot after the actions", () => {
    render(
      <PageHeader title="Order" actions={actionsOf(1)} endContent={<i data-testid="end" />} />,
    );
    const group = screen.getByTestId("end").parentElement as HTMLElement;
    expect(group.lastElementChild).toBe(screen.getByTestId("end"));
    expect(within(group).getByRole("button", { name: "Action 1" })).toBeTruthy();
  });

  it("puts `label` on the root as the accessibility label only when given", () => {
    const { rerender } = render(<PageHeader title="Order" testID="header" />);
    expect(screen.getByTestId("header").hasAttribute("aria-label")).toBe(false);
    expect(screen.getByTestId("header").getAttribute("data-extra")).not.toContain("role");
    rerender(<PageHeader title="Order" testID="header" label="Order header" />);
    expect(screen.getByTestId("header").getAttribute("aria-label")).toBe("Order header");
    // The group role comes with the name only, so an unnamed header is no empty group.
    expect(screen.getByTestId("header").getAttribute("data-extra")).toContain("role");
  });

  it("passes unknown props to the root and refuses a missing title and accessibilityLabel", () => {
    render(
      <PageHeader title="Order" testID="header" accessibilityHint="Header" className="extra" />,
    );
    expect(screen.getByTestId("header").getAttribute("data-extra")).toContain("accessibilityHint");
    expect(screen.getByTestId("header").className).toContain("extra");
    // @ts-expect-error: the title is required
    const untitled: PageHeaderProps = { description: "No title" };
    // @ts-expect-error: `label` is the header's name, not `accessibilityLabel`
    const raw: PageHeaderProps = { title: "Order", accessibilityLabel: "Header" };
    expect([untitled, raw]).toHaveLength(2);
  });
});
