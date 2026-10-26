/**
 * Stackra file contract:
 * Purpose: proves the native Section is a `group` card named by `label`, or by its title when that is a string, and by
 *          nothing otherwise; hands the card title its level (default 2); draws the description, a string or number in
 *          the start slot and the body inside Text, and no body without one; draws the first action as the primary
 *          button and the next two as secondary ones, a danger action in the danger colours, an action's `onPress` and
 *          then its `href` through the RouterProvider or the system browser (a failed open warns without the URL), a
 *          disabled action as a disabled button, the actions past three in an ActionMenu named by `moreActionsLabel`,
 *          and the end slot after them; and that it passes unknown props to the card and refuses a missing title and
 *          `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native, the native Card, Text, Button and ActionMenu are
 *           replaced by recording stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-170
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { RouterContext } from "#native/router-provider/router-context";
import { Section } from "#native/section/section";
import type { SectionProps } from "#native/section/section.props";

/** What the stand-ins were last handed: the Linking mock, the card's props and the menus. */
const received = vi.hoisted(() => ({
  openURL: undefined as unknown as (url: string) => Promise<void>,
  card: {} as Record<string, unknown>,
  menus: [] as Record<string, unknown>[],
}));

vi.mock("react-native", () => ({
  Linking: { openURL: (url: string) => received.openURL(url) },
  View: ({ children }: { children?: ReactNode }) => <div data-testid="view">{children}</div>,
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));
vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  const part = (name: string) => (props: { children?: ReactNode } & Record<string, unknown>) =>
    createElement(
      "div",
      { "data-testid": name, "data-level": props["level"] as number | undefined },
      props.children,
    );
  return {
    Card: Object.assign(
      (props: { children?: ReactNode } & Record<string, unknown>) => {
        received.card = props;
        return createElement(
          "div",
          { "data-testid": "card", "aria-label": props["accessibilityLabel"] as string },
          props.children,
        );
      },
      {
        Header: part("card-header"),
        Title: part("card-title"),
        Description: part("card-description"),
        Content: part("card-content"),
      },
    ),
  };
});
vi.mock("#native/button/button", () => ({
  Button: ({
    children,
    variant,
    size,
    isDisabled,
    startIcon,
    onPress,
  }: {
    children?: ReactNode;
    variant?: string;
    size?: string;
    isDisabled?: boolean;
    startIcon?: ReactNode;
    onPress?: () => void;
  }) => (
    <button
      type="button"
      data-variant={variant}
      data-size={size}
      disabled={isDisabled}
      onClick={onPress}
    >
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

describe("Section (native)", () => {
  beforeEach(() => {
    received.menus.length = 0;
    received.card = {};
    received.openURL = () => Promise.resolve();
  });

  it("is a group card named by label, or by a string title, or by nothing", () => {
    const { rerender } = render(<Section title="Summary" />);
    expect(received.card["role"]).toBe("group");
    expect(screen.getByTestId("card").getAttribute("aria-label")).toBe("Summary");
    rerender(<Section title="Summary" label="Billing summary" />);
    expect(screen.getByTestId("card").getAttribute("aria-label")).toBe("Billing summary");
    rerender(<Section title={<i>Summary</i>} />);
    expect(screen.getByTestId("card").hasAttribute("aria-label")).toBe(false);
  });

  it("hands the card title its level, default 2", () => {
    const { rerender } = render(<Section title="Summary" />);
    expect(screen.getByTestId("card-title").getAttribute("data-level")).toBe("2");
    expect(screen.getByTestId("card-title").textContent).toBe("Summary");
    rerender(<Section title="Summary" headingLevel={3} />);
    expect(screen.getByTestId("card-title").getAttribute("data-level")).toBe("3");
  });

  it("draws the description, and a string in the start slot and the body inside Text", () => {
    const { rerender } = render(<Section title="Summary" />);
    expect(screen.queryByTestId("card-description")).toBeNull();
    expect(screen.queryByTestId("card-content")).toBeNull();
    rerender(
      <Section title="Summary" description="What the order holds" startContent="Lead">
        Body text
      </Section>,
    );
    expect(screen.getByTestId("card-description").textContent).toBe("What the order holds");
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual([
      "Lead",
      "Body text",
    ]);
    expect(screen.getByTestId("card-content").textContent).toBe("Body text");
  });

  it("draws a node body and start slot as given", () => {
    render(
      <Section title="Summary" startContent={<i data-testid="lead" />}>
        <b data-testid="body" />
      </Section>,
    );
    expect(screen.getByTestId("lead")).toBeTruthy();
    expect(screen.getByTestId("body")).toBeTruthy();
    expect(screen.queryByTestId("text")).toBeNull();
  });

  it("draws the first action as the primary button and the next two as secondary ones", () => {
    render(<Section title="Summary" actions={actionsOf(3)} />);
    expect(buttons().map((button) => [button.textContent, button.dataset["variant"]])).toEqual([
      ["Action 1", "primary"],
      ["Action 2", "secondary"],
      ["Action 3", "secondary"],
    ]);
    expect(buttons().every((button) => button.dataset["size"] === "sm")).toBe(true);
  });

  it("draws a danger action in the danger colours, primary or not", () => {
    const { rerender } = render(
      <Section title="Summary" actions={actionsOf(1, { tone: "danger" })} />,
    );
    expect(buttons()[0]?.dataset["variant"]).toBe("danger");
    rerender(
      <Section
        title="Summary"
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
      <Section
        title="Summary"
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
        <Section title="Summary" actions={actionsOf(1, { onPress })} />
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
        <Section
          title="Summary"
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
        <Section title="Summary" actions={actionsOf(1, { href: "https://example.com/x" })} />
      </RouterContext>,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(openURL).toHaveBeenCalledWith("https://example.com/x");
    expect(navigate).not.toHaveBeenCalled();
    rerender(<Section title="Summary" actions={actionsOf(1, { href: "/orders" })} />);
    fireEvent.click(buttons()[0] as HTMLElement);
    expect(openURL).toHaveBeenLastCalledWith("/orders");
  });

  it("warns without the URL when the system browser cannot open it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    received.openURL = () => Promise.reject(new Error("no handler"));
    render(
      <Section title="Summary" actions={actionsOf(1, { href: "https://example.com/secret" })} />,
    );
    fireEvent.click(buttons()[0] as HTMLElement);
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(String(warn.mock.calls[0])).not.toContain("secret");
    warn.mockRestore();
  });

  it("puts the actions past three in an ActionMenu named by moreActionsLabel", () => {
    render(
      <Section title="Summary" actions={actionsOf(5)} moreActionsLabel="More for this summary" />,
    );
    expect(buttons()).toHaveLength(3);
    const [menu] = received.menus;
    expect(menu?.["label"]).toBe("More for this summary");
    expect(menu?.["variant"]).toBe("secondary");
    expect(menu?.["size"]).toBe("sm");
    const sections = menu?.["sections"] as { items: { id: string }[]; isTitleHidden: boolean }[];
    expect(sections).toHaveLength(1);
    expect(sections[0]?.isTitleHidden).toBe(true);
    expect(sections[0]?.items.map((item) => item.id)).toEqual(["a4", "a5"]);
  });

  it("names the overflow menu 'More actions' by default and draws none when everything fits", () => {
    const { rerender } = render(<Section title="Summary" actions={actionsOf(4)} />);
    expect(received.menus.at(-1)?.["label"]).toBe("More actions");
    received.menus.length = 0;
    rerender(<Section title="Summary" actions={actionsOf(3)} />);
    expect(received.menus).toHaveLength(0);
  });

  it("draws the end slot after the actions, a string inside Text", () => {
    const { rerender } = render(
      <Section title="Summary" actions={actionsOf(1)} endContent={<i data-testid="end" />} />,
    );
    const group = screen.getByTestId("end").parentElement as HTMLElement;
    expect(group.lastElementChild).toBe(screen.getByTestId("end"));
    expect(within(group).getByRole("button", { name: "Action 1" })).toBeTruthy();
    rerender(<Section title="Summary" endContent="Updated" />);
    expect(screen.getByTestId("text").textContent).toBe("Updated");
  });

  it("passes unknown props to the card and refuses a missing title and accessibilityLabel", () => {
    render(<Section title="Summary" testID="section" />);
    expect(received.card["testID"]).toBe("section");
    // @ts-expect-error: the title is required
    const untitled: SectionProps = { description: "No title" };
    // @ts-expect-error: `label` is the section's name, not `accessibilityLabel`
    const raw: SectionProps = { title: "Summary", accessibilityLabel: "Summary" };
    expect([untitled, raw]).toHaveLength(2);
  });
});
