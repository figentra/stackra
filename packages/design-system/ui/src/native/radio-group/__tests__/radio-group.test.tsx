/**
 * Stackra file contract:
 * Purpose: proves the native RadioGroup hands HeroUI Native's group the chosen key from `value` or from its own state
 *          (`defaultValue`), reports each change with the new key, refuses a press while read-only, draws one item
 *          with a label, description and radio per option, lays out by `orientation`, names the group by its label,
 *          draws the group's description and error message, passes the states, the variant and unknown props
 *          through, and refuses HeroUI Native's own names for what the contract names.
 * Boundary: React Native does not render in vitest, so heroui-native and react-native are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-085 sta-350:FR-086 sta-350:FR-087 sta-350:FR-088
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ChoiceOption } from "#contracts/types/choice-option.type";
import { RadioGroup, type RadioGroupProps } from "#native/radio-group/radio-group";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
  items: [] as Record<string, unknown>[],
  labels: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  const item = (props: Record<string, unknown>) => {
    received.items.push(props);
    return createElement("div", { "data-testid": "item" }, props["children"] as ReactNode);
  };
  return {
    RadioGroup: Object.assign(record("group"), { Item: item }),
    Radio: record("radio"),
    Label: (props: Record<string, unknown>) => {
      received.labels.push(props);
      return createElement("div", { "data-testid": "label" }, props["children"] as ReactNode);
    },
    Description: record("description"),
    FieldError: record("field-error"),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

const OPTIONS: readonly ChoiceOption[] = [
  { value: "standard", label: "Standard", description: "5 to 7 days" },
  { value: "express", label: "Express", isDisabled: true },
];

const propsOf = (name: string) => received.props[name] ?? {};
const choose = (key: string) =>
  act(() => (propsOf("group")["onValueChange"] as (value: string) => void)(key));

describe("RadioGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.views = [];
    received.items = [];
    received.labels = [];
  });

  it("has nothing chosen by default and starts from defaultValue", () => {
    render(<RadioGroup label="A" options={OPTIONS} />);
    expect(propsOf("group")["value"]).toBeUndefined();
    received.props = {};
    render(<RadioGroup label="A" options={OPTIONS} defaultValue="standard" />);
    expect(propsOf("group")["value"]).toBe("standard");
  });

  it("holds its own choice when uncontrolled and reports each change with the new key", () => {
    const onChange = vi.fn();
    render(<RadioGroup label="A" options={OPTIONS} onChange={onChange} />);
    choose("standard");
    expect(onChange).toHaveBeenLastCalledWith("standard");
    expect(propsOf("group")["value"]).toBe("standard");
  });

  it("is controlled by value: it shows value and keeps it until the owner changes it", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RadioGroup label="A" options={OPTIONS} value="standard" onChange={onChange} />,
    );
    choose("express");
    expect(onChange).toHaveBeenLastCalledWith("express");
    expect(propsOf("group")["value"]).toBe("standard");
    rerender(<RadioGroup label="A" options={OPTIONS} value="express" onChange={onChange} />);
    expect(propsOf("group")["value"]).toBe("express");
  });

  it("refuses a press while read-only", () => {
    const onChange = vi.fn();
    render(<RadioGroup label="A" options={OPTIONS} isReadOnly onChange={onChange} />);
    choose("standard");
    expect(onChange).not.toHaveBeenCalled();
    expect(propsOf("group")["value"]).toBeUndefined();
  });

  it("draws one item per option, in order, with its label, description and radio", () => {
    const { queryAllByTestId } = render(<RadioGroup label="A" options={OPTIONS} />);
    expect(received.items.map((item) => item["value"])).toEqual(["standard", "express"]);
    expect(received.items.map((item) => item["isDisabled"])).toEqual([undefined, true]);
    expect(queryAllByTestId("radio")).toHaveLength(2);
    expect(queryAllByTestId("description").map((node) => node.textContent)).toEqual([
      "5 to 7 days",
    ]);
    expect(queryAllByTestId("label").map((node) => node.textContent)).toEqual([
      "A",
      "Standard",
      "Express",
    ]);
  });

  it("stacks the options by default and puts them in a wrapping row when horizontal", () => {
    const { rerender } = render(<RadioGroup label="A" options={OPTIONS} />);
    expect(received.views[0]?.["className"]).toBeUndefined();
    rerender(<RadioGroup label="A" options={OPTIONS} orientation="horizontal" />);
    expect(received.views.some((view) => view["className"] === "flex-row flex-wrap gap-x-4")).toBe(
      true,
    );
  });

  it("names the group by its label, as a string and as the element the label is", () => {
    const { rerender } = render(<RadioGroup label="Shipping" options={OPTIONS} />);
    expect(propsOf("group")["accessibilityLabel"]).toBe("Shipping");
    expect(propsOf("group")["aria-labelledby"]).toBe(received.labels[0]?.["nativeID"]);
    rerender(<RadioGroup label={<b>Shipping</b>} options={OPTIONS} />);
    expect(propsOf("group")["accessibilityLabel"]).toBeUndefined();
    expect(propsOf("group")["aria-labelledby"]).toBeTruthy();
    rerender(<RadioGroup options={OPTIONS} accessibilityLabel="Pick" />);
    expect(propsOf("group")["accessibilityLabel"]).toBe("Pick");
    expect(propsOf("group")["aria-labelledby"]).toBeUndefined();
  });

  it("draws the group's description and error message when given", () => {
    const { queryByTestId, queryAllByTestId, rerender } = render(
      <RadioGroup label="A" options={OPTIONS} />,
    );
    expect(queryByTestId("field-error")).toBeNull();
    rerender(
      <RadioGroup
        label="A"
        options={OPTIONS}
        description="How fast"
        errorMessage="Choose one"
        isInvalid
      />,
    );
    expect(queryByTestId("field-error")?.textContent).toBe("Choose one");
    expect(queryAllByTestId("description").map((node) => node.textContent)).toContain("How fast");
  });

  it("hands the states and the variant to HeroUI Native, leaves out what the caller left out, and passes unknown props through", () => {
    render(
      <RadioGroup
        label="A"
        options={OPTIONS}
        isRequired
        isInvalid
        isDisabled
        variant="secondary"
        testID="group"
        name="shipping"
      />,
    );
    expect(propsOf("group")).toMatchObject({
      isInvalid: true,
      isDisabled: true,
      variant: "secondary",
      testID: "group",
    });
    expect(received.labels[0]).toMatchObject({ isRequired: true });
    expect("name" in propsOf("group")).toBe(false);
    received.props = {};
    render(<RadioGroup label="A" options={OPTIONS} />);
    expect("isInvalid" in propsOf("group")).toBe(false);
    expect("variant" in propsOf("group")).toBe(false);
  });

  it("refuses HeroUI Native's names for what the contract names", () => {
    // @ts-expect-error `onValueChange` is `onChange`.
    const handler: RadioGroupProps = { options: [], onValueChange: () => undefined };
    // @ts-expect-error `children` is `options`.
    const children: RadioGroupProps = { options: [], children: "x" };
    expectTypeOf<RadioGroupProps["value"]>().toEqualTypeOf<string | undefined>();
    expect([handler, children]).toHaveLength(2);
  });
});
