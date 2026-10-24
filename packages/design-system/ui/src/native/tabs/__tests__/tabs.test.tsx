/**
 * Stackra file contract:
 * Purpose: proves the native Tabs hands HeroUI Native the variant and a value that is always one id (the first tab that
 *          is not disabled, `defaultSelectedKeys`, or the controlled `selectedKeys`), reports each press as a list of one
 *          id, draws a trigger and a label per item and a content per item with the tab list named by `label`, disables
 *          every trigger while the list is disabled, wraps a string content in Text, shows the empty state or a named
 *          busy spinner when there are no tabs, reads `orientation` as horizontal, passes the rest through, and refuses
 *          HeroUI's `value`, children and a selection mode.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the Spinner and Text wrappers are
 *          replaced by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its
 *          rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-136
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";
import { Tabs, type TabsProps } from "#native/tabs/tabs";

/** The props each stand-in was last handed, and every set of props a trigger and a content were handed. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  triggers: [] as Record<string, unknown>[],
  contents: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "trigger") received.triggers.push(props);
    if (name === "content") received.contents.push(props);
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Tabs: Object.assign(record("root"), {
      List: record("list"),
      ScrollView: record("scroll"),
      Indicator: record("indicator"),
      Trigger: record("trigger"),
      Label: record("label"),
      Content: record("content"),
    }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["view"] = props;
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return {
    Spinner: (props: Record<string, unknown>) => {
      received.props["spinner"] = props;
      return createElement("div", { "data-testid": "spinner" });
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as ReactNode),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const has = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-testid="${name}"]`) !== null;
const change = (id: string) =>
  act(() => (propsOf("root")["onValueChange"] as (value: string) => void)(id));

const ITEMS = [
  { id: "details", label: "Details", content: "Order details", isDisabled: true },
  { id: "items", label: "Items", content: "Order items" },
  { id: "history", label: "History", content: <span>Order history</span> },
] as const;

describe("Tabs (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.triggers = [];
    received.contents = [];
  });

  it("starts on the first tab that is not disabled, and from `defaultSelectedKeys` when given", () => {
    const first = render(<Tabs items={ITEMS} />);
    expect(propsOf("root")["value"]).toBe("items");
    first.unmount();
    render(<Tabs items={ITEMS} defaultSelectedKeys={["history"]} />);
    expect(propsOf("root")["value"]).toBe("history");
  });

  it("reports each press as a list of one id and follows it when uncontrolled", () => {
    const onSelectionChange = vi.fn();
    render(<Tabs items={ITEMS} onSelectionChange={onSelectionChange} />);
    change("history");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["history"]);
    expect(propsOf("root")["value"]).toBe("history");
  });

  it("follows `selectedKeys` when controlled, and falls back to the first usable tab for none", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Tabs items={ITEMS} selectedKeys={["items"]} onSelectionChange={onSelectionChange} />,
    );
    change("history");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["history"]);
    expect(propsOf("root")["value"]).toBe("items");
    rerender(
      <Tabs items={ITEMS} selectedKeys={["history"]} onSelectionChange={onSelectionChange} />,
    );
    expect(propsOf("root")["value"]).toBe("history");
    rerender(<Tabs items={ITEMS} selectedKeys={[]} onSelectionChange={onSelectionChange} />);
    expect(propsOf("root")["value"]).toBe("items");
  });

  it("hands the root the variant only when set", () => {
    const { rerender } = render(<Tabs items={ITEMS} />);
    expect(propsOf("root")).not.toHaveProperty("variant");
    rerender(<Tabs items={ITEMS} variant="secondary" />);
    expect(propsOf("root")["variant"]).toBe("secondary");
  });

  it("draws a trigger with a label and a content per item, in order", () => {
    const { container } = render(<Tabs items={ITEMS} />);
    expect(received.triggers.map((trigger) => trigger["value"])).toEqual([
      "details",
      "items",
      "history",
    ]);
    expect(received.contents.map((content) => content["value"])).toEqual([
      "details",
      "items",
      "history",
    ]);
    expect(has(container, "indicator")).toBe(true);
    expect(propsOf("label")["children"]).toBe("History");
  });

  it("names the tab list by `label`, and leaves it unnamed without one", () => {
    const { rerender } = render(<Tabs items={ITEMS} label="Order sections" />);
    expect(propsOf("list")["accessibilityLabel"]).toBe("Order sections");
    received.props = {};
    rerender(<Tabs items={ITEMS} />);
    expect(propsOf("list")).not.toHaveProperty("accessibilityLabel");
  });

  it("disables a tab that is disabled, and every tab while the list is", () => {
    const { rerender } = render(<Tabs items={ITEMS} />);
    expect(received.triggers.map((trigger) => trigger["isDisabled"])).toEqual([true, false, false]);
    received.triggers = [];
    rerender(<Tabs items={ITEMS} isDisabled />);
    expect(received.triggers.map((trigger) => trigger["isDisabled"])).toEqual([true, true, true]);
  });

  it("wraps a string content in Text, and draws any other node as it is", () => {
    const { container } = render(<Tabs items={ITEMS} />);
    const texts = [...container.querySelectorAll('[data-testid="text"]')];
    expect(texts.map((text) => text.textContent)).toEqual(["Order details", "Order items"]);
    expect(container.textContent).toContain("Order history");
  });

  it("shows the empty state when there are no tabs", () => {
    const { container } = render(<Tabs items={[]} emptyState={<p>No sections yet</p>} />);
    expect(container.textContent).toBe("No sections yet");
    expect(has(container, "root")).toBe(false);
  });

  it("shows one named busy spinner, not the empty state, while loading with no tabs", () => {
    const { container } = render(
      <Tabs
        items={[]}
        isLoading
        loadingLabel="Loading sections"
        emptyState={<p>No sections yet</p>}
      />,
    );
    expect(container.textContent).toBe("");
    expect(propsOf("view")["accessibilityState"]).toEqual({ busy: true });
    expect(propsOf("spinner")["label"]).toBe("Loading sections");
  });

  it("leaves the tabs usable while loading once they exist", () => {
    const { container } = render(<Tabs items={ITEMS} isLoading loadingLabel="Loading" />);
    expect(has(container, "root")).toBe(true);
    expect(has(container, "spinner")).toBe(false);
  });

  it("reads `orientation` as horizontal and keeps the contract's own props off the root", () => {
    render(<Tabs items={ITEMS} orientation="vertical" testID="tabs" />);
    expect(propsOf("root")).toMatchObject({ testID: "tabs" });
    for (const name of ["orientation", "items", "label", "selectedKeys", "isDisabled"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
  });

  it("types: extends the contract and refuses HeroUI's value, children and a selection mode", () => {
    expectTypeOf<TabsProps>().toExtend<TabsContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the selection is `selectedKeys`, a list of ids
    void (<Tabs items={ITEMS} value="items" />);
    // @ts-expect-error tabs are `items`, never children
    void (<Tabs items={ITEMS}>x</Tabs>);
    // @ts-expect-error a tab list always holds exactly one tab
    void (<Tabs items={ITEMS} selectionMode="multiple" />);
  });
});
