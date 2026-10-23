/**
 * Stackra file contract:
 * Purpose: proves the native Checkbox hands HeroUI Native's ControlField the selected state from `value` or from its
 *          own state (`defaultValue`), reports each change with the new state, refuses the press while read-only,
 *          announces itself as the one `checkbox` (mixed when indeterminate) with the inner box hidden, draws the
 *          label, description and error message, draws the bar of an indeterminate box, passes the states, the
 *          variant and unknown props through, and refuses HeroUI Native's own names for what the contract names.
 * Boundary: React Native does not render in vitest, so heroui-native and react-native are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-086 sta-350:FR-087 sta-350:FR-088
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Checkbox, type CheckboxProps } from "#native/checkbox/checkbox";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    ControlField: Object.assign(record("control-field"), { Indicator: record("indicator") }),
    Checkbox: Object.assign(record("checkbox"), { Indicator: record("checkbox-indicator") }),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("field-error"),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": "view" }, props["children"] as ReactNode),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const change = (next: boolean) =>
  act(() => (propsOf("control-field")["onSelectedChange"] as (value: boolean) => void)(next));

describe("Checkbox (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is unchecked by default and starts from defaultValue", () => {
    const { rerender } = render(<Checkbox label="A" />);
    expect(propsOf("control-field")["isSelected"]).toBe(false);
    rerender(<Checkbox label="A" defaultValue />);
    // The first render's state wins: an uncontrolled field reads defaultValue only once.
    expect(propsOf("control-field")["isSelected"]).toBe(false);
    received.props = {};
    const { unmount } = render(<Checkbox label="B" defaultValue />);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
    unmount();
  });

  it("holds its own state when uncontrolled and reports each change with the new state", () => {
    const onChange = vi.fn();
    render(<Checkbox label="A" onChange={onChange} />);
    change(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
    change(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(propsOf("control-field")["isSelected"]).toBe(false);
  });

  it("is controlled by value: it shows value and keeps it until the owner changes it", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox label="A" value={false} onChange={onChange} />);
    change(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(propsOf("control-field")["isSelected"]).toBe(false);
    rerender(<Checkbox label="A" value onChange={onChange} />);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
  });

  it("refuses the press while read-only", () => {
    const onChange = vi.fn();
    render(<Checkbox label="A" isReadOnly onChange={onChange} />);
    change(true);
    expect(onChange).not.toHaveBeenCalled();
    expect(propsOf("control-field")["isSelected"]).toBe(false);
  });

  it("announces itself as one checkbox with its state, and hides the inner box and its touches", () => {
    const { rerender } = render(<Checkbox label="A" value isDisabled />);
    expect(propsOf("control-field")).toMatchObject({
      role: "checkbox",
      accessibilityState: { checked: true, disabled: true },
    });
    expect(propsOf("indicator")).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
      pointerEvents: "none",
    });
    rerender(<Checkbox label="A" isIndeterminate />);
    expect(propsOf("control-field")["accessibilityState"]).toMatchObject({ checked: "mixed" });
  });

  it("keeps the caller's accessibility state keys beside its own", () => {
    render(<Checkbox label="A" accessibilityState={{ busy: true }} />);
    expect(propsOf("control-field")["accessibilityState"]).toMatchObject({
      busy: true,
      checked: false,
    });
  });

  it("draws the bar of an indeterminate box as a checked box with its own indicator", () => {
    const { rerender, queryByTestId } = render(<Checkbox label="A" />);
    expect(propsOf("checkbox")["isSelected"]).toBe(false);
    expect(queryByTestId("checkbox-indicator")).toBeNull();
    rerender(<Checkbox label="A" isIndeterminate />);
    expect(propsOf("checkbox")["isSelected"]).toBe(true);
    expect(queryByTestId("checkbox-indicator")).not.toBeNull();
  });

  it("draws the label, the description and the error message, and nothing for those left out", () => {
    const { rerender, queryByTestId } = render(<Checkbox />);
    for (const name of ["label", "description", "field-error"])
      expect(queryByTestId(name)).toBeNull();
    rerender(<Checkbox label="Terms" description="Read them" errorMessage="Required" isInvalid />);
    expect(queryByTestId("label")?.textContent).toBe("Terms");
    expect(queryByTestId("description")?.textContent).toBe("Read them");
    expect(queryByTestId("field-error")?.textContent).toBe("Required");
  });

  it("hands the states and the variant to HeroUI Native, and leaves out what the caller left out", () => {
    render(<Checkbox label="A" isRequired isInvalid variant="secondary" />);
    expect(propsOf("control-field")).toMatchObject({ isRequired: true, isInvalid: true });
    expect(propsOf("checkbox")["variant"]).toBe("secondary");
    received.props = {};
    render(<Checkbox label="A" />);
    expect("isRequired" in propsOf("control-field")).toBe(false);
    expect("variant" in propsOf("checkbox")).toBe(false);
  });

  it("passes unknown props through, joins the caller's class to the row's layout and drops `name`", () => {
    render(
      <Checkbox
        label="A"
        testID="row"
        accessibilityLabel="Select row"
        className="mine"
        name="agree"
      />,
    );
    expect(propsOf("control-field")).toMatchObject({
      testID: "row",
      accessibilityLabel: "Select row",
    });
    expect(propsOf("control-field")["className"]).toBe("flex-col items-start gap-1 mine");
    expect("name" in propsOf("control-field")).toBe(false);
  });

  it("refuses HeroUI Native's names for what the contract names", () => {
    // @ts-expect-error `isSelected` is `value`.
    const selected: CheckboxProps = { isSelected: true };
    // @ts-expect-error `onSelectedChange` is `onChange`.
    const handler: CheckboxProps = { onSelectedChange: () => undefined };
    expectTypeOf<CheckboxProps["value"]>().toEqualTypeOf<boolean | undefined>();
    expect([selected, handler]).toHaveLength(2);
  });
});
