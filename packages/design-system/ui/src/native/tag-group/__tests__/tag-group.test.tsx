/**
 * Stackra file contract:
 * Purpose: proves the native TagGroup hands HeroUI Native the contract's size, variant, states and selection mode,
 *          keeps the selection as a list of keys (controlled or not) and reports each change as one, draws a tag per
 *          item with its label, disabled state and a remove button named by `removeLabel` only when a removal handler
 *          is given, reports removed keys as a list, turns selection and removal off while read-only, composes the
 *          label, description and error message, says what an empty group says, keeps `name` off the view, passes the
 *          rest through, and refuses HeroUI's selection props, children and a removal handler without a name for its
 *          button.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-080
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";
import { TagGroup, type TagGroupProps } from "#native/tag-group/tag-group";

/** The props each stand-in was last handed, and every set of props an item and a remove button were handed. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  items: [] as Record<string, unknown>[],
  removes: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "item") received.items.push(props);
    if (name === "remove") received.removes.push(props);
    const renderEmpty = props["renderEmptyState"] as (() => ReactNode) | undefined;
    return createElement(
      "div",
      { "data-testid": name },
      props["children"] as ReactNode,
      renderEmpty?.() ?? null,
    );
  };
  return {
    TagGroup: Object.assign(record("root"), {
      List: record("list"),
      Item: record("item"),
      ItemLabel: record("item-label"),
      ItemRemoveButton: record("remove"),
    }),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const has = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-testid="${name}"]`) !== null;

const ITEMS = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel" },
  { id: "gaming", label: "Gaming", isDisabled: true },
] as const;

describe("TagGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.items = [];
    received.removes = [];
  });

  it("hands the root the size, variant, states and selection mode, and none by default", () => {
    const { rerender } = render(<TagGroup items={ITEMS} />);
    expect(propsOf("root")["selectionMode"]).toBe("none");
    for (const name of ["size", "variant", "isDisabled", "isInvalid", "isRequired"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
    rerender(
      <TagGroup
        items={ITEMS}
        size="sm"
        variant="surface"
        selectionMode="multiple"
        isDisabled
        isInvalid
        isRequired
      />,
    );
    expect(propsOf("root")).toMatchObject({
      size: "sm",
      variant: "surface",
      selectionMode: "multiple",
      isDisabled: true,
      isInvalid: true,
      isRequired: true,
    });
  });

  it("draws a tag per item with its label and disabled state", () => {
    render(<TagGroup items={ITEMS} />);
    expect(received.items.map((item) => [item["id"], item["isDisabled"]])).toEqual([
      ["news", false],
      ["travel", false],
      ["gaming", true],
    ]);
  });

  it("starts from `defaultValue`, follows `value` when controlled, and reports each change as a list", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TagGroup
        items={ITEMS}
        selectionMode="multiple"
        defaultValue={["news"]}
        onChange={onChange}
      />,
    );
    expect([...(propsOf("root")["selectedKeys"] as string[])]).toEqual(["news"]);
    const change = propsOf("root")["onSelectionChange"] as (keys: Set<string | number>) => void;
    act(() => change(new Set(["news", "travel"])));
    expect(onChange).toHaveBeenLastCalledWith(["news", "travel"]);
    expect([...(propsOf("root")["selectedKeys"] as string[])]).toEqual(["news", "travel"]);
    rerender(
      <TagGroup items={ITEMS} selectionMode="multiple" value={["gaming"]} onChange={onChange} />,
    );
    expect([...(propsOf("root")["selectedKeys"] as string[])]).toEqual(["gaming"]);
    act(() => (propsOf("root")["onSelectionChange"] as typeof change)(new Set(["news"])));
    expect(onChange).toHaveBeenLastCalledWith(["news"]);
    expect([...(propsOf("root")["selectedKeys"] as string[])]).toEqual(["gaming"]);
  });

  it("gives each tag a remove button named by `removeLabel`, and reports what was removed", () => {
    const onRemove = vi.fn();
    render(<TagGroup items={ITEMS} onRemove={onRemove} removeLabel={(tag) => `Remove ${tag}`} />);
    expect(received.removes.map((remove) => remove["accessibilityLabel"])).toEqual([
      "Remove News",
      "Remove Travel",
      "Remove Gaming",
    ]);
    (propsOf("root")["onRemove"] as (keys: Set<string | number>) => void)(new Set(["travel"]));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(["travel"]);
  });

  it("has no remove button and no removal handler without one", () => {
    const { container } = render(<TagGroup items={ITEMS} />);
    expect(has(container, "remove")).toBe(false);
    expect(propsOf("root")).not.toHaveProperty("onRemove");
  });

  it("turns selection and removal off while read-only", () => {
    render(
      <TagGroup
        items={ITEMS}
        selectionMode="multiple"
        isReadOnly
        onRemove={() => undefined}
        removeLabel={(tag) => tag}
      />,
    );
    expect(propsOf("root")["selectionMode"]).toBe("none");
    expect(propsOf("root")).not.toHaveProperty("onRemove");
  });

  it("composes the label, description and error message, the description giving way to the error", () => {
    const { container } = render(
      <TagGroup items={ITEMS} label="Topics" description="Hint" errorMessage="Pick a topic" />,
    );
    expect(propsOf("label")["children"]).toBe("Topics");
    expect(propsOf("description")).toMatchObject({ children: "Hint", hideOnInvalid: true });
    expect(propsOf("error")["children"]).toBe("Pick a topic");
    const bare = render(<TagGroup items={ITEMS} />);
    for (const name of ["label", "description", "error"]) {
      expect(has(bare.container, name)).toBe(false);
    }
    expect(has(container, "label")).toBe(true);
  });

  it("says what an empty group says, and gives HeroUI nothing to render without a message", () => {
    const { container, rerender } = render(<TagGroup items={[]} emptyMessage="No topics yet" />);
    expect(container.textContent).toContain("No topics yet");
    rerender(<TagGroup items={[]} />);
    expect(propsOf("list")).not.toHaveProperty("renderEmptyState");
  });

  it("keeps the form name, the contract's own props and HeroUI's selection off the root", () => {
    render(<TagGroup items={ITEMS} name="topics" testID="group" accessibilityLabel="Topics" />);
    expect(propsOf("root")).toMatchObject({ testID: "group", accessibilityLabel: "Topics" });
    for (const name of ["name", "items", "value", "emptyMessage", "removeLabel", "disabledKeys"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
  });

  it("types: extends the contract and refuses HeroUI's selection, children and an unnamed removal", () => {
    expectTypeOf<TagGroupProps>().toExtend<TagGroupContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the selection is `value`
    void (<TagGroup items={ITEMS} selectedKeys={["news"]} />);
    // @ts-expect-error tags are `items`, never children
    void (<TagGroup items={ITEMS}>x</TagGroup>);
    // @ts-expect-error a remove button needs a spoken name
    void (<TagGroup items={ITEMS} onRemove={() => undefined} />);
    // @ts-expect-error without a removal handler there is no button to name
    void (<TagGroup items={ITEMS} removeLabel={(tag: string) => tag} />);
  });
});
