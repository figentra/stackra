/**
 * Stackra file contract:
 * Purpose: proves the native Accordion hands HeroUI Native one id as a string in single mode and a list in multiple mode,
 *          starts from `defaultExpandedKeys`, follows `expandedKeys` when controlled, reports every change as a list of
 *          ids in the items' order (a collapse as an empty list), draws an item, trigger, indicator and content per
 *          section with its disabled state, wraps a string title and content in Text, hands the root the variant and the
 *          disabled switch only when set, passes the rest through, and refuses HeroUI's `selectionMode`, `value`,
 *          children and `allowsMultipleExpanded`.
 * Boundary: React Native does not render in vitest, so heroui-native and the Text wrapper are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-138
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { AccordionContractProps } from "#contracts/types/accordion-contract-props.type";
import { Accordion, type AccordionProps } from "#native/accordion/accordion";

/** The props each stand-in was last handed, and every set of props an item and a text were handed. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  items: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "item") received.items.push(props);
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Accordion: Object.assign(record("root"), {
      Item: record("item"),
      Trigger: record("trigger"),
      Indicator: record("indicator"),
      Content: record("content"),
    }),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      received.texts.push(props);
      return createElement("span", { "data-testid": "text" }, props["children"] as ReactNode);
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const change = (next: unknown) =>
  act(() => (propsOf("root")["onValueChange"] as (v: unknown) => void)(next));

const ITEMS = [
  { id: "shipping", title: "Shipping", content: "Ships in two days" },
  { id: "returns", title: "Returns", content: <span>Free for thirty days</span> },
  { id: "warranty", title: <b>Warranty</b>, content: "Two years", isDisabled: true },
] as const;

describe("Accordion (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.items = [];
    received.texts = [];
  });

  it("is single by default, handing HeroUI no value until a section opens", () => {
    render(<Accordion items={ITEMS} />);
    expect(propsOf("root")["selectionMode"]).toBe("single");
    expect(propsOf("root")["value"]).toBeUndefined();
  });

  it("starts from `defaultExpandedKeys`, one id as a string in single mode", () => {
    render(<Accordion items={ITEMS} defaultExpandedKeys={["returns"]} />);
    expect(propsOf("root")["value"]).toBe("returns");
  });

  it("reports a single section as a list of one id, and a collapse as an empty list", () => {
    const onExpandedChange = vi.fn();
    render(<Accordion items={ITEMS} onExpandedChange={onExpandedChange} />);
    change("shipping");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["shipping"]);
    expect(propsOf("root")["value"]).toBe("shipping");
    change(undefined);
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    expect(propsOf("root")["value"]).toBeUndefined();
  });

  it("is multiple with `canExpandMultiple`, a list in and a list out in the items' order", () => {
    const onExpandedChange = vi.fn();
    render(
      <Accordion
        items={ITEMS}
        canExpandMultiple
        defaultExpandedKeys={["returns"]}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(propsOf("root")["selectionMode"]).toBe("multiple");
    expect(propsOf("root")["value"]).toEqual(["returns"]);
    change(["returns", "shipping"]);
    expect(onExpandedChange).toHaveBeenLastCalledWith(["shipping", "returns"]);
    expect(propsOf("root")["value"]).toEqual(["shipping", "returns"]);
  });

  it("follows `expandedKeys` when controlled", () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Accordion items={ITEMS} expandedKeys={["shipping"]} onExpandedChange={onExpandedChange} />,
    );
    change("returns");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["returns"]);
    expect(propsOf("root")["value"]).toBe("shipping");
    rerender(
      <Accordion items={ITEMS} expandedKeys={["returns"]} onExpandedChange={onExpandedChange} />,
    );
    expect(propsOf("root")["value"]).toBe("returns");
  });

  it("draws an item, trigger, indicator and content per section, with each disabled state", () => {
    const { container } = render(<Accordion items={ITEMS} />);
    expect(received.items.map((item) => [item["value"], item["isDisabled"]])).toEqual([
      ["shipping", false],
      ["returns", false],
      ["warranty", true],
    ]);
    expect(container.querySelectorAll('[data-testid="trigger"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-testid="indicator"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-testid="content"]')).toHaveLength(3);
  });

  it("wraps a string title and content in Text, and draws any other node as it is", () => {
    const { container } = render(<Accordion items={ITEMS} />);
    // Drawn in document order: each section's title, then its content.
    expect(received.texts.map((text) => text["children"])).toEqual([
      "Shipping",
      "Ships in two days",
      "Returns",
      "Two years",
    ]);
    expect(container.querySelector("b")?.textContent).toBe("Warranty");
    expect(container.querySelector("span:not([data-testid])")?.textContent).toBe(
      "Free for thirty days",
    );
  });

  it("lets a string title fill the trigger row so the indicator sits at the end", () => {
    render(<Accordion items={ITEMS} />);
    expect(received.texts[0]?.["className"]).toBe("flex-1");
  });

  it("hands the root the variant and the disabled switch only when set", () => {
    const { rerender } = render(<Accordion items={ITEMS} />);
    expect(propsOf("root")).not.toHaveProperty("variant");
    expect(propsOf("root")).not.toHaveProperty("isDisabled");
    rerender(<Accordion items={ITEMS} variant="surface" isDisabled />);
    expect(propsOf("root")).toMatchObject({ variant: "surface", isDisabled: true });
  });

  it("passes the rest through and keeps the contract's own props off the root", () => {
    render(<Accordion items={ITEMS} testID="accordion" hideSeparator />);
    expect(propsOf("root")).toMatchObject({ testID: "accordion", hideSeparator: true });
    for (const name of ["items", "expandedKeys", "canExpandMultiple", "onExpandedChange"]) {
      expect(propsOf("root")).not.toHaveProperty(name);
    }
  });

  it("types: extends the contract and refuses HeroUI's names for expansion, children and a selection", () => {
    expectTypeOf<AccordionProps>().toExtend<AccordionContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error several open is `canExpandMultiple`
    void (<Accordion items={ITEMS} selectionMode="multiple" />);
    // @ts-expect-error the open sections are `expandedKeys`, a list of ids
    void (<Accordion items={ITEMS} value="shipping" />);
    // @ts-expect-error sections are `items`, never children
    void (<Accordion items={ITEMS}>x</Accordion>);
  });
});
