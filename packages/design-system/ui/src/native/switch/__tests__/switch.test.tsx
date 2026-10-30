/**
 * Stackra file contract:
 * Purpose: proves the native Switch hands HeroUI Native's ControlField the selected state from `value` or from its
 *          own state (`defaultValue`), reports each change with the new state, refuses the press while read-only,
 *          announces itself as the one `switch` with the inner control hidden, draws the label before the control, the
 *          description and the error message, passes the states and unknown props through, and refuses HeroUI Native's
 *          own names for what the contract names.
 * Boundary: React Native does not render in vitest, so heroui-native and react-native are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-086 sta-350:FR-087 sta-350:FR-088
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Switch } from "#native/switch/switch";
import type { SwitchProps } from "#native/switch/switch.props";

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
    Label: record("label"),
    Description: record("description"),
    FieldError: record("field-error"),
    Switch: record("switch"),
    useThemeColor: (names: readonly string[]) => names.map((name) => `color:${name}`),
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

describe("Switch (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is off by default and starts from defaultValue", () => {
    render(<Switch label="A" />);
    expect(propsOf("control-field")["isSelected"]).toBe(false);
    received.props = {};
    render(<Switch label="B" defaultValue />);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
  });

  it("holds its own state when uncontrolled and reports each change with the new state", () => {
    const onChange = vi.fn();
    render(<Switch label="A" onChange={onChange} />);
    change(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
  });

  it("is controlled by value: it shows value and keeps it until the owner changes it", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch label="A" value={false} onChange={onChange} />);
    change(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(propsOf("control-field")["isSelected"]).toBe(false);
    rerender(<Switch label="A" value onChange={onChange} />);
    expect(propsOf("control-field")["isSelected"]).toBe(true);
  });

  it("refuses the press while read-only", () => {
    const onChange = vi.fn();
    render(<Switch label="A" isReadOnly onChange={onChange} />);
    change(true);
    expect(onChange).not.toHaveBeenCalled();
    expect(propsOf("control-field")["isSelected"]).toBe(false);
  });

  it("announces itself as one switch with its state, and hides the inner control and its touches", () => {
    render(<Switch label="A" value isDisabled accessibilityState={{ busy: true }} />);
    expect(propsOf("control-field")).toMatchObject({
      role: "switch",
      accessibilityState: { checked: true, disabled: true, busy: true },
    });
    expect(propsOf("indicator")).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
      pointerEvents: "none",
    });
  });

  it("draws the label before the control, and the description and error message when given", () => {
    const { container, queryByTestId, rerender } = render(<Switch />);
    for (const name of ["label", "description", "field-error"])
      expect(queryByTestId(name)).toBeNull();
    rerender(<Switch label="Beta" description="Early features" errorMessage="No" isInvalid />);
    expect(queryByTestId("label")?.textContent).toBe("Beta");
    expect(queryByTestId("description")?.textContent).toBe("Early features");
    expect(queryByTestId("field-error")?.textContent).toBe("No");
    const order = [...container.querySelectorAll("[data-testid]")].map((node) =>
      node.getAttribute("data-testid"),
    );
    expect(order.indexOf("label")).toBeLessThan(order.indexOf("indicator"));
  });

  it("hands the states to HeroUI Native, leaves out what the caller left out, and passes unknown props through", () => {
    render(<Switch label="A" isRequired isInvalid testID="row" className="mine" name="beta" />);
    expect(propsOf("control-field")).toMatchObject({
      isRequired: true,
      isInvalid: true,
      testID: "row",
      className: "flex-col items-start gap-1 mine",
    });
    expect("name" in propsOf("control-field")).toBe(false);
    received.props = {};
    render(<Switch label="A" />);
    expect("isRequired" in propsOf("control-field")).toBe(false);
  });

  it("draws the off track in the field edge colour and the on track in the accent", () => {
    render(<Switch label="A" />);
    expect(propsOf("switch")["animation"]).toEqual({
      backgroundColor: { value: ["color:field-border", "color:accent"] },
    });
  });

  it("refuses HeroUI Native's names for what the contract names", () => {
    // @ts-expect-error `isSelected` is `value`.
    const selected: SwitchProps = { isSelected: true };
    // @ts-expect-error `onSelectedChange` is `onChange`.
    const handler: SwitchProps = { onSelectedChange: () => undefined };
    expectTypeOf<SwitchProps["value"]>().toEqualTypeOf<boolean | undefined>();
    expect([selected, handler]).toHaveLength(2);
  });
});
