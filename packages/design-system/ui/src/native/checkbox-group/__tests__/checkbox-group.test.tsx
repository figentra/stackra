/**
 * Stackra file contract:
 * Purpose: proves the native CheckboxGroup is a `group` view named by its label, draws one native Checkbox per option
 *          with that option's checked state, reports the list of chosen keys on each change in the order they were
 *          checked, holds its own list when uncontrolled, applies group and option disabled states and read-only to
 *          every box, draws the group's description and error message, and refuses `children`.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the sibling Checkbox are
 *          replaced by recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-084 sta-350:FR-086 sta-350:FR-087 sta-350:FR-088
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ChoiceOption } from "#contracts/types/choice-option.type";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import type { CheckboxGroupProps } from "#native/checkbox-group/checkbox-group.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  boxes: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Label: record("label"),
    Description: record("description"),
    FieldError: record("field-error"),
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

vi.mock("#native/checkbox/checkbox", async () => {
  const { createElement } = await import("react");
  return {
    Checkbox: (props: Record<string, unknown>) => {
      received.boxes.push(props);
      return createElement("div", { "data-testid": "checkbox" });
    },
  };
});

const OPTIONS: readonly ChoiceOption[] = [
  { value: "email", label: "Email", description: "Weekly digest" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push", isDisabled: true },
];

const propsOf = (name: string) => received.props[name] ?? {};
/** The latest props of the box for `key`: each render pushes one entry per option, in order. */
const boxFor = (key: string) =>
  received.boxes.slice(-OPTIONS.length)[OPTIONS.findIndex((option) => option.value === key)] ?? {};
const toggle = (key: string, isChecked: boolean) =>
  act(() => (boxFor(key)["onChange"] as (value: boolean) => void)(isChecked));

describe("CheckboxGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.boxes = [];
  });

  it("is a group named by its label, with one checkbox per option in order", () => {
    const { queryAllByTestId } = render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    expect(propsOf("view")).toMatchObject({ role: "group", accessibilityLabel: "Channels" });
    expect(propsOf("view")["aria-labelledby"]).toBe(propsOf("label")["nativeID"]);
    expect(queryAllByTestId("checkbox")).toHaveLength(3);
    expect(received.boxes.map((box) => box["label"])).toEqual(["Email", "SMS", "Push"]);
    expect(received.boxes[0]?.["description"]).toBe("Weekly digest");
  });

  it("checks the boxes of the chosen keys, from defaultValue first", () => {
    render(<CheckboxGroup label="Channels" options={OPTIONS} defaultValue={["sms"]} />);
    expect(received.boxes.map((box) => box["value"])).toEqual([false, true, false]);
  });

  it("holds its own list when uncontrolled and reports the chosen keys in the order they were checked", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup label="Channels" options={OPTIONS} onChange={onChange} />);
    toggle("sms", true);
    expect(onChange).toHaveBeenLastCalledWith(["sms"]);
    toggle("email", true);
    expect(onChange).toHaveBeenLastCalledWith(["sms", "email"]);
    toggle("sms", false);
    expect(onChange).toHaveBeenLastCalledWith(["email"]);
    expect(received.boxes.slice(-3).map((box) => box["value"])).toEqual([true, false, false]);
  });

  it("is controlled by value: it shows value and keeps it until the owner changes it", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CheckboxGroup label="Channels" options={OPTIONS} value={["email"]} onChange={onChange} />,
    );
    toggle("sms", true);
    expect(onChange).toHaveBeenLastCalledWith(["email", "sms"]);
    expect(received.boxes.slice(-3).map((box) => box["value"])).toEqual([true, false, false]);
    rerender(
      <CheckboxGroup
        label="Channels"
        options={OPTIONS}
        value={["email", "sms"]}
        onChange={onChange}
      />,
    );
    expect(received.boxes.slice(-3).map((box) => box["value"])).toEqual([true, true, false]);
  });

  it("refuses a press while read-only", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup label="Channels" options={OPTIONS} isReadOnly onChange={onChange} />);
    toggle("sms", true);
    expect(onChange).not.toHaveBeenCalled();
    expect(boxFor("sms")["isReadOnly"]).toBe(true);
  });

  it("disables one option on its own, or every box with the group", () => {
    const { rerender } = render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    expect(received.boxes.map((box) => box["isDisabled"])).toEqual([false, false, true]);
    received.boxes = [];
    rerender(<CheckboxGroup label="Channels" options={OPTIONS} isDisabled />);
    expect(received.boxes.map((box) => box["isDisabled"])).toEqual([true, true, true]);
  });

  it("hands the invalid state and the variant to every box, and leaves out what the caller left out", () => {
    render(<CheckboxGroup label="Channels" options={OPTIONS} isInvalid variant="secondary" />);
    expect(received.boxes.every((box) => box["isInvalid"] === true)).toBe(true);
    expect(received.boxes.every((box) => box["variant"] === "secondary")).toBe(true);
    received.boxes = [];
    render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    expect(received.boxes.every((box) => !("variant" in box) && !("isInvalid" in box))).toBe(true);
  });

  it("draws the group's description and error message when given, and the label's required mark", () => {
    const { queryByTestId, rerender } = render(
      <CheckboxGroup label="Channels" options={OPTIONS} />,
    );
    expect(queryByTestId("field-error")).toBeNull();
    rerender(
      <CheckboxGroup
        label="Channels"
        options={OPTIONS}
        description="Pick at least one"
        errorMessage="Choose a channel"
        isInvalid
        isRequired
      />,
    );
    expect(queryByTestId("description")?.textContent).toBe("Pick at least one");
    expect(queryByTestId("field-error")?.textContent).toBe("Choose a channel");
    expect(propsOf("label")).toMatchObject({ isRequired: true });
  });

  it("passes unknown props through, joins the caller's class and drops `name`", () => {
    render(<CheckboxGroup options={OPTIONS} testID="group" className="mine" name="channels" />);
    expect(propsOf("view")).toMatchObject({ testID: "group", className: "gap-2 mine" });
    expect("name" in propsOf("view")).toBe(false);
  });

  it("refuses children, which the options replace", () => {
    // @ts-expect-error `children` is `options`.
    const children: CheckboxGroupProps = { options: [], children: "x" };
    expectTypeOf<CheckboxGroupProps["value"]>().toEqualTypeOf<readonly string[] | undefined>();
    expect(children).toBeTruthy();
  });
});
