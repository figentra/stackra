/**
 * Stackra file contract:
 * Purpose: proves the native ComboBox, built on HeroUI Native's Select because it has no ComboBox, opens as a bottom
 *          sheet on both root and content, hands the Select the option of a key or the options of a list, reports
 *          keys as a string, `null` or a list, filters the list on the text typed into the sheet's search field
 *          without caring for case or accents (or leaves it to the app), reports and clears that text, asks for more
 *          items at the end of the list, shows a named spinner while loading and says "no match", toggles items in
 *          multiple mode without closing the sheet, never opens while read-only, names the search field, composes the
 *          label, description and error message, fills its parent only when asked, and refuses children and a missing
 *          list.
 * Boundary: React Native does not render in vitest, so heroui-native, FlatList, the spinner and the text are replaced
 *          by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-077 sta-350:FR-078 sta-350:FR-079
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import { ComboBox } from "#native/combo-box/combo-box";
import type { ComboBoxProps } from "#native/combo-box/combo-box.props";

/** The props each stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Select: Object.assign(record("root"), {
      Trigger: record("trigger"),
      Value: record("value"),
      TriggerIndicator: record("indicator"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      ListLabel: record("list-label"),
      Item: record("item"),
      ItemLabel: record("item-label"),
      ItemDescription: record("item-description"),
      ItemIndicator: record("item-indicator"),
    }),
    SearchField: Object.assign(record("search"), {
      Group: record("group"),
      SearchIcon: record("search-icon"),
      Input: record("input"),
    }),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    cn: (...names: (string | undefined)[]) => names.filter(Boolean).join(" "),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    FlatList: (props: Record<string, unknown>) => {
      received.props["list"] = props;
      const data = props["data"] as unknown[];
      const renderItem = props["renderItem"] as (info: { item: unknown }) => ReactNode;
      return createElement(
        "div",
        { "data-testid": "list" },
        data.map((item, index) => createElement("div", { key: index }, renderItem({ item }))),
        data.length === 0 ? (props["ListEmptyComponent"] as ReactNode) : null,
        props["ListFooterComponent"] as ReactNode,
      );
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
      createElement("span", { "data-testid": "empty" }, props["children"] as ReactNode),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const has = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-testid="${name}"]`) !== null;

/** The ids of the items the list was last handed. */
const listed = () => (propsOf("list")["data"] as { id: string }[]).map((item) => item.id);
/** Whether a press on an item closes the sheet, as the last item was handed it. */
const closes = () => propsOf("item")["closeOnPress"];
const typeText = (text: string) =>
  act(() => (propsOf("search")["onChange"] as (text: string) => void)(text));

const ITEMS = [
  { id: "ar", label: "Argentina", description: "South America" },
  { id: "au", label: "Australia" },
  { id: "at", label: "Austria", isDisabled: true },
  { id: "cl", label: "Café" },
] as const;

describe("ComboBox (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("opens as a bottom sheet, the same on the root and the content", () => {
    render(<ComboBox items={ITEMS} />);
    expect(propsOf("root")["presentation"]).toBe("bottom-sheet");
    expect(propsOf("content")["presentation"]).toBe("bottom-sheet");
    expect(propsOf("content")).toMatchObject({
      detached: true,
      bottomInset: 32,
      className: "mx-4",
      backgroundClassName: "rounded-[var(--radius-container)]",
    });
  });

  it("hands the Select the option of a key, and none for `null` or no key", () => {
    const { rerender } = render(<ComboBox items={ITEMS} value="au" defaultValue="cl" />);
    expect(propsOf("root")["value"]).toEqual({ value: "au", label: "Australia" });
    expect(propsOf("root")["defaultValue"]).toEqual({ value: "cl", label: "Café" });
    rerender(<ComboBox items={ITEMS} value={null} />);
    expect(propsOf("root")).not.toHaveProperty("value");
  });

  it("reports the chosen option as a key string, and `null` for nothing", () => {
    const onChange = vi.fn();
    render(<ComboBox items={ITEMS} onChange={onChange} />);
    const change = propsOf("root")["onValueChange"] as (option: unknown) => void;
    change({ value: "au", label: "Australia" });
    expect(onChange).toHaveBeenLastCalledWith("au");
    change(undefined);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("hands the Select the options of a list in multiple mode, and reports the keys as a list", () => {
    const onChange = vi.fn();
    render(
      <ComboBox
        items={ITEMS}
        selectionMode="multiple"
        value={["ar", "cl", "missing"]}
        defaultValue={["au"]}
        onChange={onChange}
      />,
    );
    expect(propsOf("root")["selectionMode"]).toBe("multiple");
    expect(propsOf("root")["value"]).toEqual([
      { value: "ar", label: "Argentina" },
      { value: "cl", label: "Café" },
    ]);
    expect(propsOf("root")["defaultValue"]).toEqual([{ value: "au", label: "Australia" }]);
    (propsOf("root")["onValueChange"] as (options: unknown[]) => void)([
      { value: "ar", label: "Argentina" },
      undefined,
      { value: "au", label: "Australia" },
    ]);
    expect(onChange).toHaveBeenLastCalledWith(["ar", "au"]);
  });

  it("closes the sheet after a press in single mode and keeps it open in multiple mode", () => {
    const { rerender } = render(<ComboBox items={ITEMS} />);
    expect(closes()).toBe(true);
    rerender(<ComboBox items={ITEMS} selectionMode="multiple" />);
    expect(closes()).toBe(false);
  });

  it("draws an item per match with its label, key and disabled state, and a description when it has one", () => {
    const { container } = render(<ComboBox items={ITEMS} />);
    expect(listed()).toEqual(["ar", "au", "at", "cl"]);
    expect(container.querySelectorAll('[data-testid="item"]')).toHaveLength(4);
    expect(propsOf("item-description")["children"]).toBe("South America");
    expect(propsOf("item")).toMatchObject({ value: "cl", label: "Café", disabled: false });
  });

  it("filters the list on the typed text, without caring for case or accents", () => {
    render(<ComboBox items={ITEMS} />);
    typeText("AUS");
    expect(listed()).toEqual(["au", "at"]);
    typeText("cafe");
    expect(listed()).toEqual(["cl"]);
    typeText("  ");
    expect(listed()).toEqual(["ar", "au", "at", "cl"]);
  });

  it("shows every item and reports the text when the app filters", () => {
    const onInputChange = vi.fn();
    render(<ComboBox items={ITEMS} isServerFiltered onInputChange={onInputChange} />);
    typeText("zzz");
    expect(onInputChange).toHaveBeenLastCalledWith("zzz");
    expect(listed()).toEqual(["ar", "au", "at", "cl"]);
  });

  it("follows `inputValue` when the app controls the text", () => {
    render(<ComboBox items={ITEMS} inputValue="cafe" onInputChange={() => undefined} />);
    expect(propsOf("search")["value"]).toBe("cafe");
    expect(listed()).toEqual(["cl"]);
    typeText("other");
    expect(propsOf("search")["value"]).toBe("cafe");
  });

  it("clears the text when the sheet closes, and still tells the caller", () => {
    const onOpenChange = vi.fn();
    render(<ComboBox items={ITEMS} onOpenChange={onOpenChange} />);
    typeText("aus");
    expect(propsOf("search")["value"]).toBe("aus");
    act(() => (propsOf("root")["onOpenChange"] as (open: boolean) => void)(false));
    expect(propsOf("search")["value"]).toBe("");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("asks for more items at the end of the list", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<ComboBox items={ITEMS} onLoadMore={onLoadMore} />);
    (propsOf("list")["onEndReached"] as () => void)();
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(<ComboBox items={ITEMS} />);
    expect(propsOf("list")).not.toHaveProperty("onEndReached");
  });

  it("shows a named spinner under the list while loading, and none otherwise", () => {
    const { container, rerender } = render(
      <ComboBox items={ITEMS} isLoading loadingLabel="Loading more countries" />,
    );
    expect(propsOf("spinner")).toMatchObject({ label: "Loading more countries", size: "sm" });
    rerender(<ComboBox items={ITEMS} />);
    expect(has(container, "spinner")).toBe(false);
  });

  it("says what it says when nothing matches, and nothing without a message or while loading", () => {
    const { container, rerender } = render(
      <ComboBox items={ITEMS} emptyMessage="No country found" />,
    );
    typeText("zzz");
    expect(container.querySelector('[data-testid="empty"]')?.textContent).toBe("No country found");
    rerender(<ComboBox items={ITEMS} />);
    expect(has(container, "empty")).toBe(false);
    rerender(<ComboBox items={ITEMS} emptyMessage="No country found" isLoading />);
    expect(has(container, "empty")).toBe(false);
  });

  it("never opens while read-only, and passes disabled to the Select", () => {
    const { rerender } = render(<ComboBox items={ITEMS} isReadOnly isDisabled />);
    expect(propsOf("root")).toMatchObject({ isOpen: false, isDisabled: true });
    rerender(<ComboBox items={ITEMS} />);
    expect(propsOf("root")).not.toHaveProperty("isOpen");
  });

  it("names the search field by the label, or the placeholder when the label is not text", () => {
    const { rerender } = render(<ComboBox items={ITEMS} label="Country" placeholder="Search" />);
    expect(propsOf("input")).toMatchObject({
      accessibilityLabel: "Country",
      placeholder: "Search",
    });
    expect(propsOf("list-label")["children"]).toBe("Country");
    rerender(<ComboBox items={ITEMS} label={<b>Country</b>} placeholder="Search" />);
    expect(propsOf("input")["accessibilityLabel"]).toBe("Search");
  });

  it("composes the label, description and error message with the field's states", () => {
    const { container } = render(
      <ComboBox
        items={ITEMS}
        label="Country"
        description="Where it ships from"
        errorMessage="Pick one"
        isRequired
        isInvalid
        placeholder="Search"
      />,
    );
    expect(propsOf("label")).toMatchObject({
      children: "Country",
      isRequired: true,
      isInvalid: true,
    });
    expect(propsOf("description")["children"]).toBe("Where it ships from");
    expect(propsOf("error")).toMatchObject({ children: "Pick one", isInvalid: true });
    expect(propsOf("value")["placeholder"]).toBe("Search");
    const bare = render(<ComboBox items={ITEMS} />);
    for (const name of ["label", "description", "error", "list-label"]) {
      expect(has(bare.container, name)).toBe(false);
    }
    expect(has(container, "label")).toBe(true);
  });

  it("fills its parent only when asked, and keeps the caller's class and the rest of the props", () => {
    const { rerender } = render(<ComboBox items={ITEMS} className="mine" testID="field" />);
    expect(propsOf("root")).toMatchObject({ className: "self-start mine", testID: "field" });
    rerender(<ComboBox items={ITEMS} isFullWidth />);
    expect(propsOf("root")["className"]).toBe("");
    for (const name of ["items", "name", "inputValue", "onLoadMore", "emptyMessage"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
  });

  it("types: extends the contract, refuses children and a missing list, and tells the modes apart", () => {
    expectTypeOf<ComboBoxProps>().toExtend<ComboBoxContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error choices are `items`, never children
    void (<ComboBox items={ITEMS}>x</ComboBox>);
    // @ts-expect-error a combo box needs its choices
    void (<ComboBox />);
    // @ts-expect-error several choices hold a list of keys
    void (<ComboBox items={ITEMS} selectionMode="multiple" value="au" />);
    // @ts-expect-error one choice holds a key
    void (<ComboBox items={ITEMS} value={["au"]} />);
  });
});
