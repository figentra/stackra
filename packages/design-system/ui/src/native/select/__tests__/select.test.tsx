/**
 * Stackra file contract:
 * Purpose: proves the native Select hands HeroUI Native the key as the `{ value, label }` option it holds (none for a
 *          `null` or missing key, so the field runs uncontrolled and clears), reports the chosen option as a key string
 *          or `null`, gives the root and the content the same presentation, sizes a popover to its trigger, draws each
 *          item with its label, optional description and disabled state, composes the label, description and error
 *          message with the field's states, never opens while read-only, fills its parent only when asked, passes the
 *          rest through, and refuses `children`, HeroUI's value props and a missing list.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-075 sta-350:FR-076
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { SelectContractProps } from "#contracts/types/select-contract-props.type";
import { Select } from "#native/select/select";
import type { SelectProps } from "#native/select/select.props";

/** The props each stand-in was last handed, and every set of props an item was handed, in order. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  items: [] as Record<string, unknown>[],
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "item") received.items.push(props);
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
      Item: record("item"),
      ItemLabel: record("item-label"),
      ItemDescription: record("item-description"),
      ItemIndicator: record("item-indicator"),
    }),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    cn: (...names: (string | undefined)[]) => names.filter(Boolean).join(" "),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const has = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-testid="${name}"]`) !== null;

const ITEMS = [
  { id: "draft", label: "Draft", description: "Not sent yet" },
  { id: "sent", label: "Sent" },
  { id: "void", label: "Void", isDisabled: true },
] as const;

describe("Select (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.items = [];
  });

  it("hands HeroUI Native the option of the chosen key, and none for `null` or no key", () => {
    const { rerender } = render(<Select items={ITEMS} value="sent" defaultValue="draft" />);
    expect(propsOf("root")["value"]).toEqual({ value: "sent", label: "Sent" });
    expect(propsOf("root")["defaultValue"]).toEqual({ value: "draft", label: "Draft" });
    rerender(<Select items={ITEMS} value={null} />);
    expect(propsOf("root")).not.toHaveProperty("value");
    expect(propsOf("root")).not.toHaveProperty("defaultValue");
    rerender(<Select items={ITEMS} value="unknown" />);
    expect(propsOf("root")).not.toHaveProperty("value");
  });

  it("reports the chosen option as a key string, and `null` for nothing", () => {
    const onChange = vi.fn();
    render(<Select items={ITEMS} onChange={onChange} />);
    const change = propsOf("root")["onValueChange"] as (option: unknown) => void;
    change({ value: "sent", label: "Sent" });
    expect(onChange).toHaveBeenLastCalledWith("sent");
    change(undefined);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("gives the root and the content the same presentation, a popover by default", () => {
    const { rerender } = render(<Select items={ITEMS} />);
    expect(propsOf("root")["presentation"]).toBe("popover");
    expect(propsOf("content")["presentation"]).toBe("popover");
    expect(propsOf("content")["width"]).toBe("trigger");
    rerender(<Select items={ITEMS} presentation="bottom-sheet" />);
    expect(propsOf("root")["presentation"]).toBe("bottom-sheet");
    expect(propsOf("content")["presentation"]).toBe("bottom-sheet");
    expect(propsOf("content")).not.toHaveProperty("width");
    expect(propsOf("content")).toMatchObject({
      detached: true,
      bottomInset: 32,
      className: "mx-4",
      backgroundClassName: "rounded-4xl",
    });
  });

  it("draws an item per choice, with its label, key and disabled state", () => {
    render(<Select items={ITEMS} />);
    expect(received.items.map((item) => [item["value"], item["label"], item["disabled"]])).toEqual([
      ["draft", "Draft", false],
      ["sent", "Sent", false],
      ["void", "Void", true],
    ]);
  });

  it("adds a description under the label of an item that has one, and uses HeroUI's content for the rest", () => {
    const { container } = render(<Select items={ITEMS} />);
    expect(propsOf("item-description")["children"]).toBe("Not sent yet");
    expect(container.querySelectorAll('[data-testid="item-label"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="item-indicator"]')).toHaveLength(1);
    expect(received.items[1]?.["children"]).toBeUndefined();
  });

  it("composes the label, description and error message with the field's states", () => {
    const { container } = render(
      <Select
        items={ITEMS}
        label="Status"
        description="Where it stands"
        errorMessage="Choose one"
        isRequired
        isInvalid
        isDisabled
        placeholder="Pick one"
      />,
    );
    expect(propsOf("label")).toMatchObject({
      children: "Status",
      isRequired: true,
      isInvalid: true,
      isDisabled: true,
    });
    expect(propsOf("description")).toMatchObject({
      children: "Where it stands",
      isInvalid: true,
      isDisabled: true,
    });
    expect(propsOf("error")).toMatchObject({ children: "Choose one", isInvalid: true });
    expect(propsOf("value")["placeholder"]).toBe("Pick one");
    expect(propsOf("root")["isDisabled"]).toBe(true);
    expect(has(container, "label")).toBe(true);
  });

  it("leaves out the label, description and error message it was not given", () => {
    const { container } = render(<Select items={ITEMS} />);
    for (const name of ["label", "description", "error"]) expect(has(container, name)).toBe(false);
  });

  it("never opens while read-only", () => {
    const { rerender } = render(<Select items={ITEMS} isReadOnly />);
    expect(propsOf("root")["isOpen"]).toBe(false);
    rerender(<Select items={ITEMS} />);
    expect(propsOf("root")).not.toHaveProperty("isOpen");
  });

  it("fills its parent only when asked, and keeps the caller's class", () => {
    const { rerender } = render(<Select items={ITEMS} className="mine" />);
    expect(propsOf("root")["className"]).toBe("self-start mine");
    rerender(<Select items={ITEMS} isFullWidth className="mine" />);
    expect(propsOf("root")["className"]).toBe("mine");
    rerender(<Select items={ITEMS} isFullWidth />);
    expect(propsOf("root")["className"]).toBe("");
  });

  it("passes the rest through and keeps the contract's own props off the root", () => {
    render(
      <Select items={ITEMS} testID="field" accessibilityLabel="Order status" label="Status" />,
    );
    expect(propsOf("root")).toMatchObject({ testID: "field", accessibilityLabel: "Order status" });
    for (const name of ["items", "label", "placeholder", "isFullWidth", "onChange"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
  });

  it("types: extends the contract and refuses children, HeroUI's value props and a missing list", () => {
    expectTypeOf<SelectProps>().toExtend<SelectContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error choices are `items`, never children
    void (<Select items={ITEMS}>x</Select>);
    // @ts-expect-error the value is `value`, a key
    void (<Select items={ITEMS} onValueChange={() => undefined} />);
    // @ts-expect-error the selection is one key: several is a ComboBox
    void (<Select items={ITEMS} selectionMode="multiple" />);
    // @ts-expect-error a select needs its choices
    void (<Select />);
  });
});
