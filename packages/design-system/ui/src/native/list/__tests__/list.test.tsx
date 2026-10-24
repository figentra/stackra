/**
 * Stackra file contract:
 * Purpose: proves the native List draws each item as a ListGroup row in a `FlatList` named as a list with a separator
 *          between rows, hands a row's title, description, start icon, end content and chevron to HeroUI Native's
 *          parts (wrapping a string in text), makes a pressable row a button and a plain one never pressable, refuses a
 *          disabled row, selects as radios or checkboxes with the checked state and a checkmark and reports ids in the
 *          items' order (controlled and not) without calling a row's `onPress`, shows `emptyState` only when nothing
 *          loads, is busy and names one spinner while loading, passes the end reached to the `FlatList` only while
 *          `hasMore` and not loading, and passes its root's props through.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the wrappers below List are
 *           replaced by recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-121 sta-350:FR-122 sta-350:FR-128 sta-350:FR-129 sta-350:P-064
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-contract-props.type";
import { List, type ListProps } from "#native/list/list";

/** The props each stand-in was last handed, by name; a row is recorded per title in `rows`. */
const received = vi.hoisted(() => {
  /** The first string among the children's own children: a row's title, which comes before every other text of it. */
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- `vi.hoisted` runs before the imports, so it cannot see module scope
  const firstText = (node: unknown): string => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(firstText).find((text) => text !== "") ?? "";
    const inner = (node as { props?: { children?: unknown } } | null)?.props?.children;
    return inner === undefined ? "" : firstText(inner);
  };
  return {
    firstText,
    props: {} as Record<string, Record<string, unknown>>,
    rows: {} as Record<string, Record<string, unknown>>,
  };
});

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const slot = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    ListGroup: Object.assign(slot("group"), {
      Item: (props: Record<string, unknown>) => {
        const children = props["children"] as ReactNode;
        received.rows[received.firstText(children)] = props;
        return createElement(
          "div",
          {
            "data-testid": "row",
            role: props["accessibilityRole"] as string | undefined,
            onClick: () => {
              if (props["disabled"] !== true) (props["onPress"] as (() => void) | undefined)?.();
            },
          },
          children,
        );
      },
      ItemPrefix: slot("prefix"),
      ItemContent: slot("content"),
      ItemTitle: slot("title"),
      ItemDescription: slot("description"),
      ItemSuffix: slot("suffix"),
    }),
  };
});

vi.mock("react-native", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      // Only the list's root carries the busy state; the views inside it are not recorded.
      if ("accessibilityState" in props) received.props["view"] = props;
      return createElement(
        "div",
        { "data-testid": (props["testID"] as string | undefined) ?? "view" },
        props["children"] as ReactNode,
      );
    },
    FlatList: (props: Record<string, unknown>) => {
      received.props["list"] = props;
      const data = props["data"] as readonly { id: string }[];
      const renderItem = props["renderItem"] as (info: { item: unknown }) => ReactNode;
      const Separator = props["ItemSeparatorComponent"] as () => ReactNode;
      return createElement(
        "div",
        { "data-testid": "flat-list" },
        data.map((item, index) =>
          createElement(
            Fragment,
            { key: item.id },
            index > 0 ? createElement(Separator) : null,
            renderItem({ item }),
          ),
        ),
      );
    },
  };
});

vi.mock("#native/icon/icon", () => ({
  Icon: (props: Record<string, unknown>) => {
    received.props[`icon-${String(props["name"])}`] = props;
    return null;
  },
}));

vi.mock("#native/separator/separator", async () => {
  const { createElement } = await import("react");
  return { Separator: () => createElement("hr", { "data-testid": "separator" }) };
});

vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return {
    Spinner: (props: Record<string, unknown>) => {
      received.props["spinner"] = props;
      return createElement("i", { "data-testid": "spinner" });
    },
  };
});

const ITEMS: readonly ListItemData[] = [
  { id: "a", title: "Alpha", description: "First" },
  { id: "b", title: "Bravo" },
  { id: "c", title: "Charlie" },
];

const propsOf = (name: string) => received.props[name] ?? {};
const rowOf = (title: string) => received.rows[title] ?? {};

describe("List (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.rows = {};
  });

  it("draws one row per item in a FlatList named as a list, with a separator between rows", () => {
    render(<List label="Recent" items={ITEMS} />);
    expect(screen.getAllByTestId("row")).toHaveLength(3);
    expect(screen.getAllByTestId("separator")).toHaveLength(2);
    expect(propsOf("list")).toMatchObject({
      accessibilityRole: "list",
      accessibilityLabel: "Recent",
    });
    const keyExtractor = propsOf("list")["keyExtractor"] as (item: ListItemData) => string;
    expect(ITEMS.map(keyExtractor)).toEqual(["a", "b", "c"]);
  });

  it("hands the surface variant to the group only when set", () => {
    const { unmount } = render(<List label="Recent" items={ITEMS} />);
    expect(propsOf("group")).not.toHaveProperty("variant");
    unmount();
    render(<List label="Recent" items={ITEMS} variant="secondary" />);
    expect(propsOf("group")).toMatchObject({ variant: "secondary" });
  });

  it("draws a row's title, description, start icon, end content and chevron through HeroUI Native's parts", () => {
    render(
      <List
        label="Recent"
        items={[
          {
            id: "a",
            title: "Alpha",
            description: "First",
            startIcon: "user",
            endContent: "42",
            hasChevron: true,
          },
        ]}
      />,
    );
    expect(screen.getByTestId("title").textContent).toBe("Alpha");
    expect(screen.getByTestId("prefix")).toBeTruthy();
    expect(propsOf("icon-user")).toMatchObject({ name: "user" });
    // A bare string at the end is wrapped in the description text, never left outside a Text.
    expect(
      screen.getAllByTestId("description").map((description) => description.textContent),
    ).toEqual(["First", "42"]);
    expect(screen.getByTestId("suffix")).toBeTruthy();
  });

  it("draws no prefix, description, end content or chevron when the row has none", () => {
    render(<List label="Recent" items={[{ id: "b", title: "Bravo" }]} />);
    expect(screen.queryByTestId("prefix")).toBeNull();
    expect(screen.queryByTestId("description")).toBeNull();
    expect(screen.queryByTestId("suffix")).toBeNull();
  });

  it("makes a pressable row a button that runs onPress, and a plain row neither", () => {
    const onPress = vi.fn();
    render(
      <List
        label="Recent"
        items={[
          { id: "a", title: "Alpha", onPress },
          { id: "b", title: "Bravo" },
        ]}
      />,
    );
    expect(rowOf("Alpha")["accessibilityRole"]).toBe("button");
    expect(rowOf("Bravo")).not.toHaveProperty("accessibilityRole");
    expect(rowOf("Bravo")).not.toHaveProperty("onPress");
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("names a row by `label` and refuses and dims a disabled one", () => {
    const onPress = vi.fn();
    render(
      <List
        label="Recent"
        items={[{ id: "a", title: "Alpha", label: "Favourites", onPress, isDisabled: true }]}
      />,
    );
    expect(rowOf("Alpha")).toMatchObject({ accessibilityLabel: "Favourites", disabled: true });
    expect(String(rowOf("Alpha")["className"])).toContain("opacity-50");
    fireEvent.click(screen.getByTestId("row"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("keeps a row at least 44 points tall", () => {
    render(<List label="Recent" items={ITEMS.slice(0, 1)} />);
    expect(String(rowOf("Alpha")["className"])).toContain("min-h-11");
  });

  it("selects one row as a radio, reports its id and clears it when pressed again", () => {
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        items={ITEMS}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(rowOf("Bravo")).toMatchObject({
      accessibilityRole: "radio",
      accessibilityState: { checked: false },
    });
    fireEvent.click(screen.getAllByTestId("row")[1] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["b"]);
    expect(rowOf("Bravo")["accessibilityState"]).toEqual({ checked: true });
    expect(propsOf("icon-check")).toMatchObject({ name: "check", tone: "accent" });
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a"]);
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("selects several rows as checkboxes and reports ids in the items' order", () => {
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        items={ITEMS}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(rowOf("Alpha")["accessibilityRole"]).toBe("checkbox");
    fireEvent.click(screen.getAllByTestId("row")[2] as HTMLElement);
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a", "c"]);
  });

  it("starts with defaultSelectedKeys and follows selectedKeys when controlled", () => {
    const { unmount } = render(
      <List label="Recent" items={ITEMS} selectionMode="multiple" defaultSelectedKeys={["b"]} />,
    );
    expect(rowOf("Bravo")["accessibilityState"]).toEqual({ checked: true });
    expect(rowOf("Alpha")["accessibilityState"]).toEqual({ checked: false });
    unmount();
    render(<List label="Recent" items={ITEMS} selectionMode="multiple" selectedKeys={["c"]} />);
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    // A press on a controlled list asks; the checked state stays what the parent holds.
    expect(rowOf("Charlie")["accessibilityState"]).toEqual({ checked: true });
    expect(rowOf("Alpha")["accessibilityState"]).toEqual({ checked: false });
  });

  it("never calls a row's onPress while it selects, and refuses a disabled row", () => {
    const onPress = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        items={[
          { id: "a", title: "Alpha", onPress },
          { id: "b", title: "Bravo", isDisabled: true },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByTestId("row")[1] as HTMLElement);
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByTestId("row")[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows the empty state only when there are no items and nothing loads", () => {
    const { rerender } = render(
      <List label="Recent" items={[]} emptyState={<i data-testid="empty" />} />,
    );
    expect(screen.getByTestId("empty")).toBeTruthy();
    expect(screen.queryByTestId("flat-list")).toBeNull();
    rerender(<List label="Recent" items={[]} emptyState={<i data-testid="empty" />} isLoading />);
    expect(screen.queryByTestId("empty")).toBeNull();
    rerender(<List label="Recent" items={ITEMS} emptyState={<i data-testid="empty" />} />);
    expect(screen.queryByTestId("empty")).toBeNull();
  });

  it("is busy while loading and names one spinner", () => {
    const { rerender } = render(
      <List label="Recent" items={ITEMS} isLoading loadingLabel="Loading orders" />,
    );
    expect(propsOf("view")["accessibilityState"]).toEqual({ busy: true });
    expect(screen.getAllByTestId("spinner")).toHaveLength(1);
    expect(propsOf("spinner")).toEqual({ label: "Loading orders" });
    rerender(<List label="Recent" items={ITEMS} />);
    expect(propsOf("view")["accessibilityState"]).toEqual({ busy: false });
    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  it("passes the end reached to the FlatList only while hasMore and not loading", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <List label="Recent" items={ITEMS} hasMore onLoadMore={onLoadMore} />,
    );
    expect(propsOf("list")["onEndReached"]).toBe(onLoadMore);
    rerender(<List label="Recent" items={ITEMS} hasMore isLoading onLoadMore={onLoadMore} />);
    expect(propsOf("list")).not.toHaveProperty("onEndReached");
    rerender(<List label="Recent" items={ITEMS} onLoadMore={onLoadMore} />);
    expect(propsOf("list")).not.toHaveProperty("onEndReached");
  });

  it("passes the root's props through", () => {
    render(<List label="Recent" items={ITEMS} testID="root" className="mine" />);
    expect(propsOf("view")).toMatchObject({ testID: "root", className: "mine" });
  });

  it("types: extends the contract and refuses the raw names", () => {
    expectTypeOf<ListProps>().toExtend<ListContractProps>();
    // @ts-expect-error the end reached is `onLoadMore` on both runtimes
    render(<List label="x" items={ITEMS} onEndReached={() => undefined} />);
    // @ts-expect-error a list needs its accessible name, `label`, not `accessibilityLabel`
    render(<List items={ITEMS} accessibilityLabel="x" />);
  });
});
